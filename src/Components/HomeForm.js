import React, { /* useContext */ useEffect } from 'react'
import { useState } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import FloatingLabel from 'react-bootstrap/FloatingLabel'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { auth, db } from '../firebase-config'
import axios from 'axios'
import './Components.css'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { Backdrop, CircularProgress } from '@mui/material'
import { useGeolocated } from 'react-geolocated'
import Header from './Header'
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore"
import { Dropdown, DropdownButton, InputGroup } from 'react-bootstrap'
// import { FirebaseAuthContext } from '../Utilities/Context/FirebaseAuthContext'

const MySwal = withReactContent(Swal);

const HomeForm = () => {
    // customer type selected
    const [type, setType] = useState("Outlet")
    // customer info
    const [info, setInfo] = useState({ activity: "", otherActivity: "", status: "", area: "", otherArea: "", name: "", otherName: "", typeOfBusiness: "", address: "", picOwner: "", phone: "+62", date: "" })
    // competitor info
    const [cpInfo, setCpInfo] = useState({ name: "", address: "", stockiest: "", market: "" })
    // additional info
    const [addInfo, setAddInfo] = useState({ resume: "", notes: "" })
    // additional info picture
    const [addInfoPic, setAddInfoPic] = useState({});
    // interflour products
    const [ifProducts, setIfProducts] = useState([{ name: "", capacity: "", capacityUnit: "KG", uom: "", quantity: "", sellingPrice: "", buyingPrice: "" }])
    // competitor products
    const [cpProducts, setCpProducts] = useState([{ name: "", capacity: "", uom: "", quantity: "", sellingPrice: "", buyingPrice: "" }])
    // stocklist products
    const [stockProducts, setStockProducts] = useState([{ code: "", name: "", type: "", uom: "", quantity: "" }])
    // loading status
    const [loading, setLoading] = useState(false);
    // interflour product list from Bitrix24
    const [ifProductList, setIfProductList] = useState([]);
    // competitor product list from Bitrix24
    const [cpProductList, setCpProductList] = useState([]);
    // stock product list from Bitrix24
    const [stockProductList, setStockProductList] = useState([]);
    // customers linked to the logged in user
    const [customers, setCustomers] = useState([]);
    // logged in user
    const [user, setUser] = useState({ name: "", email: "", company: "", empId: "" });
    const [userId, setUserId] = useState(null);
    // areas by logged in user company
    const [areas, setAreas] = useState([{ name: "" }]);
    // userRegister for addNewUsers
    // const { userRegister } = useContext(FirebaseAuthContext); 
    // userDetails stores all the json data to create new users
    // const userDetails = [];

    // add user into Firestore and Firebase authentication
    // useEffect(() => {
    //     function addNewUsers() {
    //         userDetails.map(async (user) => {
    //             await setDoc(doc(db, "users", user['Email']), {
    //                 company: user['Company'],
    //                 email: user['Email'],
    //                 employeeId: user['Emp ID'],
    //                 name: user['Emp Name']
    //             })

    //             await userRegister(user['Email'], 'interflour123');
    //         }) 
    //     } 

    //     addNewUsers();
    // }, [])

    // geolocation function
    const { coords, isGeolocationEnabled } = useGeolocated({
        positionOptions: {
            enableHighAccuracy: true,
        },
        userDecisionTimeout: 5000,
    });

    useEffect(() => {
        // fetch user details and area by user company
        async function fetchUserArea() {
            var userEmail = "";

            if (auth.currentUser) {
                userEmail = auth.currentUser.email;
            }

            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, where("email", "==", userEmail));
            const userQuerySnapshot = await getDocs(userQuery);

            userQuerySnapshot.forEach((doc) => {
                var empId = doc.data().employeeId;
                var company = doc.data().company;
                var name = doc.data().name;

                setUser({ name: name, email: userEmail, company: company, empId: empId });
            });

            const areasRef = collection(db, "areas");
            const areaQuery = query(areasRef, where("company", "==", user.company));
            const areaQuerySnapshot = await getDocs(areaQuery);

            var tempAreas = [];

            areaQuerySnapshot.forEach((doc) => {
                tempAreas.push({ name: doc.data().name });
            });

            setAreas(tempAreas);
        }

        fetchUserArea();
    }, [user.company]);

    useEffect(() => {
        async function fetchUserCustomer() {
            var userEmail = "";

            if (auth.currentUser) {
                userEmail = auth.currentUser.email;
            }

            if (userEmail) {
                const customersRef = collection(db, `customers/${userEmail}/${type}`);
                const customerQuery = query(customersRef);
                const customerQuerySnapshot = await getDocs(customerQuery);

                var tempUserCustomers = [];

                customerQuerySnapshot.forEach((doc) => {
                    tempUserCustomers.push(doc.data());
                });

                setCustomers(tempUserCustomers);
            }
        }

        // fetch customer list for their name and address
        async function fetchCustomers() {
            try {
                // fetch distributors
                var res = await axios.post("https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/crm.contact.list", {
                    filter: {
                        "ASSIGNED_BY_ID": "162"
                    }
                })

                var res_data = await res.data;

                if (res_data) {
                    setCustomers(res.data.result);
                    var nextCount = res_data.next;

                    while (nextCount) {
                        let length = res_data.result['length'];
                        let lastId = res_data.result[length - 1].ID;

                        res = await axios.post("https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/crm.contact.list", {
                            filter: {
                                ">ID": lastId,
                                "ASSIGNED_BY_ID": "162"
                            }
                        })

                        res_data = await res.data;

                        if (res_data) {
                            let newCustomers = res_data.result;
                            setCustomers(prev => [...prev, ...newCustomers]);
                        }

                        nextCount = res_data.next;
                    }
                }
            } catch (error) {
                console.log(error);
                return 0;
            }      
        }

        if (type === "Distributor") {
            fetchCustomers();
        } else {
            fetchUserCustomer();
        }
    }, [type])

    // fetch interflour and competitor product from Bitrix24 List
    useEffect(() => {
        async function fetchUserId() {
            var userEmail = '';
            var res = '';

            if (auth.currentUser) {
                userEmail = auth.currentUser.email;
            }

            // console.log("looking for " + userEmail);

            if (userEmail) {
                res = await axios.post("https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/user.get", {
                    filter: {
                        "EMAIL": userEmail,
                    }
                });

                if (res.data && res.data.result.length > 0) {
                    setUserId(res.data.result[0].ID);
                    // console.log(res.data.result[0].ID);
                } else {
                    setUserId(null);
                    console.log('You do not have a Bitrix24 login and your sales visit data has been assigned to system administrator.');
                }
            }
        }

        // fetch Interflour product list from Bitrix24
        async function fetchIfProductList() {
            var ifUrl=
            "https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/lists.element.get.json?IBLOCK_TYPE_ID=lists&IBLOCK_ID=32";

            try {
                const if_res = await axios.get(ifUrl);
                const if_res_data = await if_res.data;

                if (if_res_data) {
                    setIfProductList(if_res_data.result);
                }
                // return JSON.parse(res_data.result);
            } catch (error) {
                console.log(error);
                return 0;
            }
        }

        // fetch competitor product list from Bitrix24
        async function fetchCpProductList() {
            var cpUrl=
                "https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/lists.element.get.json?IBLOCK_TYPE_ID=lists&IBLOCK_ID=34";

            try {
                var cp_res = await axios.get(cpUrl);
                var cp_res_data = await cp_res.data;

                if (cp_res_data) {
                    setCpProductList(cp_res_data.result);
                    var nextCount = cp_res_data.next;

                    while (nextCount) {
                        let length = cp_res_data.result['length'];
                        let lastId = cp_res_data.result[length - 1].ID;

                        let nextUrl=
                            "https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/lists.element.get.json?IBLOCK_TYPE_ID=lists&IBLOCK_ID=34";

                        cp_res = await axios.post(nextUrl, {
                            filter: {
                                ">ID": lastId
                            }
                        })

                        cp_res_data = await cp_res.data;

                        if (cp_res_data) {
                            let newCpProductList = cp_res_data.result;
                            setCpProductList(prev => [...prev, ...newCpProductList]);
                        }
                        
                        nextCount = cp_res_data.next;
                    }
                }
                // return JSON.parse(res_data.result);
            } catch (error) {
                console.log(error);
                return 0;
            }
        }
        
        // fetch stock product list from Bitrix24
        async function fetchStockProductList() {
            var stockUrl=
                "https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/lists.element.get.json?IBLOCK_TYPE_ID=lists&IBLOCK_ID=40";

            try {
                const stock_res = await axios.get(stockUrl);
                const stock_res_data = await stock_res.data;

                if (stock_res_data) {
                    setStockProductList(stock_res_data.result);
                }
                // return JSON.parse(res_data.result);
            } catch (error) {
                console.log(error);
                return 0;
            }
        }

        fetchUserId();
        fetchIfProductList();
        fetchCpProductList();
        fetchStockProductList();
    }, [])

    // add product input
    const addProduct = (type) => {
        if (type === "interflour") {
            setIfProducts([...ifProducts, { name: "", capacity: "", capacityUnit: "KG", uom: "", quantity: "", sellingPrice: "", buyingPrice: "" }])
        } else if (type === "competitor") {
            setCpProducts([...cpProducts, { name: "", capacity: "", uom: "", quantity: "", sellingPrice: "", buyingPrice: "" }])
        } else if (type === "stocklist") {
            setStockProducts([...stockProducts, { code: "", name: "", type: "", uom: "", quantity: "" }])
        }
    }

    // remove product input
    const removeProduct = (type, index) => {
        if (type === "interflour" && ifProducts.length > 1) {
            let newIfProducts = [...ifProducts]
            newIfProducts.splice(index, 1)
            setIfProducts(newIfProducts)
        } else if (type === "competitor" && cpProducts.length > 1) {
            let newCpProducts = [...cpProducts]
            newCpProducts.splice(index, 1)
            setCpProducts(newCpProducts)
        } else if (type === "stocklist" && stockProducts.length > 1) {
            let newStockProducts = [...stockProducts]
            newStockProducts.splice(index, 1)
            setStockProducts(newStockProducts)
        } 
    }

    // handle customer info, competitor info, additional info change
    const handleInfoChange = (infoType, event) => {
        // console.log("setting info: " + event.target.name + " to : " + event.target.value);
        
        if (infoType === 'additional') {
            if (event.target.name === "picture") {
                // speical condition for picture input in additional info
                if (event.target.files.length > 0) {
                    let file = event.target.files[0];

                    let reader = new FileReader();
                    reader.readAsDataURL(file);
    
                    reader.onload = () => {
                        const base64String = reader.result.toString().replace(';base64,', "thisisathingtoreplace;")
                        let imgBase64 = base64String.split("thisisathingtoreplace;")
    
                        if (imgBase64) {
                            let documents = [];
                            
                            documents.push([file.name, imgBase64[1]]);
    
                            setAddInfoPic(documents);
                        }
                    }
                }
            } else {
                // normal conditon for other input in additional info
                setAddInfo({...addInfo, [event.target.name]: event.target.value})
            }
        } else if (infoType === 'competitor') {
            // normal conditon for inputs in competitor info
            setCpInfo({...cpInfo, [event.target.name]: event.target.value})
        } else if (infoType === 'information') {
            if (event.target.name === "name") {
                // fetch customer address based on the name chose
                if (event.target.value !== "Others") {
                    // get customer address from Bitrix24 if not others
                    customers.map(async(customer) => {
                        if (type === "Distributor") {
                            let customerName = customer["NAME"];

                            if (customerName === event.target.value) {
                                setInfo({...info, name: customerName, address: ""});
                                const res = await axios.post("https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/crm.contact.get.json?id=" + customer.ID);
                                const res_address = res.data.result["UF_CRM_1667468128250"];
                                const address = res_address.split("|")[0];
                                setInfo({...info, name: customerName, address: address});
            
                                return 0;
                            }
                        } else {
                            let customerName = customer["name"];

                            if (customerName === event.target.value) {
                                if (customer["typeOfBusiness"]) {
                                    setInfo({...info, name: customer["name"], area: customer["area"], address: customer["address"], typeOfBusiness: customer["typeOfBusiness"], picOwner: customer["pic"], phone: customer["phone"] });
                                } else {
                                    setInfo({...info, name: customer["name"], area: customer["area"], address: customer["address"], typeOfBusiness: "", picOwner: customer["pic"], phone: customer["phone"] });
                                }
                                
                            }
                        }
                    });
                } else {
                    // if others selected, act as normal input
                    setInfo({...info, name: event.target.value, address: "", area: "", typeOfBusiness: "", picOwner: "", phone: "+62" });
                }
            } else {
                // normal conditon for inputs in information info
                if (event.target.name === "otherName" || event.target.name === "address") {
                    // uppercase for address and otherName
                    setInfo({...info, [event.target.name]: event.target.value.toUpperCase()})
                } else if (event.target.name === "phone" ) {
                    console.log(event.target.value);
                    let tempNumber = event.target.value.split("+62");

                    if (tempNumber[1]) {
                        if (tempNumber[1].length === 1 && tempNumber[1] === "-") {
                            setInfo({...info, phone: "+62" })
                        } else if (tempNumber[1].length === 1 && tempNumber[1] !== "-") {
                            setInfo({...info, phone: "+62-" + tempNumber[1] })
                        } else if (tempNumber[1].length <= 15) {
                            let numOnly = tempNumber[1].split("-").join('');
                            let pOne = numOnly.substring(0,4) ? numOnly.substring(0,4) : "";
                            let pTwo = numOnly.substring(4,8) ? numOnly.substring(4,8) : "";
                            let pThree = numOnly.substring(8,12) ? numOnly.substring(8,12) : "";
                            
                            let newNum = "";

                            if (pOne !== "") {
                                newNum += "-" + pOne;
                            }

                            if (pTwo !== "") {
                                newNum += "-" + pTwo;
                            }

                            if (pThree !== "") {
                                newNum += "-" + pThree;
                            }

                            setInfo({...info, phone: "+62" + newNum })
                        }
                    } else {
                        setInfo({...info, phone: "+62" })
                    }
                } else {
                    setInfo({...info, [event.target.name]: event.target.value})
                }
            }
        }
    }

    // handle product input change
    const handleProductChange = (type, index, event) => {
        if (type === "interflour") {
            // conditon for interflour product input change
            let newIfProducts = [...ifProducts];

            if (event.target.name === "capacityUnit") {
                newIfProducts[index][event.target.name] = event.target.text;
            } else {
                newIfProducts[index][event.target.name] = event.target.value;
            }
            

            ifProductList.map((ifProduct) => {
                if (ifProduct["NAME"] === event.target.value) {
                    newIfProducts[index]["uom"] = Object.values(ifProduct["PROPERTY_150"])[0];
                }

                return 0;
            })

            setIfProducts(newIfProducts);
        } else if (type === "competitor") {
            // conditon for competitor product input change
            let newCpProducts = [...cpProducts];
            newCpProducts[index][event.target.name] = event.target.value;
            setCpProducts(newCpProducts);
        } else if (type === "stocklist") {
            // conditon for stocklist product input change
            let newStockProducts = [...stockProducts];
            newStockProducts[index][event.target.name] = event.target.value;

            stockProductList.map((stockProduct) => {
                if (stockProduct["NAME"] === event.target.value) {
                    // get their product code and uom based on the product selected
                    newStockProducts[index]["code"] = Object.values(stockProduct["PROPERTY_146"])[0];
                    newStockProducts[index]["uom"] = Object.values(stockProduct["PROPERTY_148"])[0];
                }

                return 0;
            });

            setStockProducts(newStockProducts);
        }
    }

    // handle customer type change
    const handleTypeChange = (type) => {
        // reset all inputs when switching type
        setType(type)
        setInfo({ activity: "", otherActivity: "", status: "", area: "", otherArea: "", name: "", otherName: "", typeOfBusiness: "", address: "", picOwner: "", phone: "+62", date: "" })
        setCpInfo({ name: "", address: "", stockiest: "", market: "" })
        setAddInfo({ resume: "", notes: "" })
        setIfProducts([{ name: "", capacity: "", capacityUnit: "KG", uom: "", quantity: "", sellingPrice: "", buyingPrice: "" }])
        setCpProducts([{ name: "", capacity: "", uom: "", quantity: "", sellingPrice: "", buyingPrice: "" }])
        setStockProducts([{ code: "", name: "", type: "", uom: "", quantity: "" }])
    }

    const addCustomer = async(name, area, address) => {
        if (type !== "Distributor") {
            const customerRef = doc(db, "customers", user.email, type, name);

            await setDoc(customerRef, {
                name: name,
                typeOfBusiness: info.typeOfBusiness,
                area: area,
                address: address,
                pic: info.picOwner,
                phone: info.phone,
                type: type,
            })

            return name;
        }   
    }

    // create deal in Bitrix24
    const dealCreate = async(categoryId, stageId, typeId) => {
        // sales type in Bitrix24
        const salesType = type === "Outlet" ? 1018 : type === "End Customer" ? 1020 : type === "Grosir" ? 1200 : 1074;
        const location = coords.latitude + ", " + coords.longitude;
        const userID = userId === null ? 106 : userId;
        const currentDate = new Date();

        // changing date format to match Bitrix24 api requirement
        let preDate = "";
        let date = "";

        // created on with time in Bitrix
        let createdDay = (currentDate.getDate() < 10 ? '0' : '') + currentDate.getDate();
        let createdMonth = ((currentDate.getMonth() + 1) < 10 ? '0' : '') + (currentDate.getMonth() + 1)
        let createdYear = currentDate.getFullYear();
        let createdHour = (currentDate.getHours() < 10 ? '0' : '') + currentDate.getHours();
        let createdMinute = (currentDate.getMinutes() < 10 ? '0' : '') + currentDate.getMinutes();
        let createdOn = createdDay + '/' + createdMonth + '/' + createdYear + ' ' + createdHour + ':' + createdMinute;
        
        if (info.date === "") {
            date = (currentDate.getMonth() + 1) + '/' + currentDate.getDate() + '/' + currentDate.getFullYear();
        } else {
            preDate = info.date.split("-");
            date = preDate[1] + '/' + preDate[2] + '/' + preDate[0];
        }

        const name = info.name === "Others" ? info.otherName : info.name;

        const area = info.area === "1080" ? info.otherArea : info.area;

        const url=
            "https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/crm.deal.add.json?" +
            "FIELDS[CATEGORY_ID]=" + categoryId +
            "&FIELDS[STAGE_ID]=" + stageId +
            "&FIELDS[TYPE_ID]=" + typeId +
            "&FIELDS[ASSIGNED_BY_ID]=" + userID +
            "&FIELDS[UF_CRM_1665038555513]=" + user.email +
            "&FIELDS[UF_CRM_1669258735909]=" + user.name +
            "&FIELDS[UF_CRM_1669258750164]=" + user.company +
            "&FIELDS[UF_CRM_1669258763363]=" + user.empId +
            "&FIELDS[UF_CRM_1665043341317]=" + salesType +
            "&FIELDS[UF_CRM_1665453740489]=" + location +
            "&FIELDS[UF_CRM_1646715948407]=" + info.activity +
            "&FIELDS[UF_CRM_1667448124377]=" + info.otherActivity +
            "&FIELDS[UF_CRM_1646717095792]=" + info.status +
            // "&FIELDS[UF_CRM_1646715886722]=" + info.area +
            "&FIELDS[UF_CRM_1667525337365]=" + area +
            "&FIELDS[UF_CRM_1667526378127]=" + name +
            "&FIELDS[UF_CRM_1665393973]=" + info.typeOfBusiness +
            "&FIELDS[UF_CRM_1650428523146]=" + encodeURIComponent(info.address) +
            "&FIELDS[UF_CRM_1661757945]=" + info.picOwner +
            "&FIELDS[UF_CRM_1667196830833]=" + encodeURIComponent(info.phone) +
            "&FIELDS[UF_CRM_1667456975955]=" + date +
            "&FIELDS[UF_CRM_1672883765608]=" + createdOn +
            "&FIELDS[UF_CRM_1646710147809]=" + cpInfo.name +
            "&FIELDS[UF_CRM_1650504559499]=" + cpInfo.address +
            "&FIELDS[UF_CRM_1646710085351]=" + cpInfo.stockiest +
            "&FIELDS[UF_CRM_1646710071665]=" + cpInfo.market +
            "&FIELDS[UF_CRM_1646717224176]=" + addInfo.resume +
            "&FIELDS[UF_CRM_1667528423355]=" + addInfo.notes;
        
        try {
            const user_res = addCustomer(name, area, info.address);
            await user_res.data;
            const res = await axios.get(url);
            const res_data = await res.data;
            return JSON.parse(res_data.result);
        } catch (error) {
            console.log(error);
            return 0;
        }
    }

    // process image if there is any image uploaded
    const dealImageUpdate = async(dealId) => {
        var url="https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/crm.deal.update.json";

        try {
            let body = {
                id: dealId,
                fields: {
                    'UF_CRM_1646710247795': {
                        "fileData": addInfoPic[0]
                    }
                }
            }

            await axios.post(url, body).then(response => {
                // console.log(response);
            })
        } catch (error) {
            console.log(error);
            return 0;
        }
    }

    // insert product into the list bind to deal in Bitrix24
    const productToList = async(product, dealId, type, count) => {
        var iblockTypeId = 'lists';
        // list id in Bitrix24 that stores product list
        var iblockId = 30;
        var elementCode = dealId;
        var url = "";
        
        if (type === "IF" || type === "CP") {
            // condition for interflour and competitor products
            url=
                "https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/lists.element.add.json?" +
                "IBLOCK_TYPE_ID=" + iblockTypeId +
                "&IBLOCK_ID=" + iblockId +
                "&ELEMENT_CODE=" + elementCode + "_" + count +
                "&FIELDS[NAME]=" + product.name +
                "&FIELDS[PROPERTY_116]=" + product.quantity +
                "&FIELDS[PROPERTY_118]=" + type +
                "&FIELDS[PROPERTY_120]=" + dealId +
                "&FIELDS[PROPERTY_122]=" + product.uom +
                "&FIELDS[PROPERTY_124]=" + product.sellingPrice +
                "&FIELDS[PROPERTY_172]=" + product.buyingPrice +
                "&FIELDS[PROPERTY_140]=" + product.capacity +
                "&FIELDS[PROPERTY_174]=" + product.capacityUnit +
                "&FIELDS[PROPERTY_158]=" + dealId;
        } else if (type === "STOCK") {
            // condition for stock products
            url=
                "https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/lists.element.add.json?" +
                "IBLOCK_TYPE_ID=" + iblockTypeId +
                "&IBLOCK_ID=" + iblockId +
                "&ELEMENT_CODE=" + elementCode + "_" + count +
                "&FIELDS[NAME]=" + product.name +
                "&FIELDS[PROPERTY_116]=" + product.quantity +
                "&FIELDS[PROPERTY_118]=" + type +
                "&FIELDS[PROPERTY_120]=" + dealId +
                "&FIELDS[PROPERTY_122]=" + product.uom +
                "&FIELDS[PROPERTY_136]=" + product.code +
                "&FIELDS[PROPERTY_138]=" + product.type +
                "&FIELDS[PROPERTY_158]=" + dealId;
        }

        try {
            const res = await axios.get(url);
            // console.log(elementCode + "_" + count);
            const res_data = await res.data;
            return res_data;
        } catch (error) {
            console.log(error);
        }
    }

    const checkValidInput = () => {
        let valid = true;
        let text = [];

        if (info.activity === "") {
            text.push("Activity");
        } else if (info.activity === "Others" && info.otherActivity === "") {
            text.push("Activity (Others)");
        }

        if (info.area === "") {
            text.push("Area");
        } else if (info.area === "1080" && info.otherArea === "") {
            text.push("Area (Others)");
        }

        if (info.name === "") {
            text.push("Name");
        } else if (info.name === "Others" && info.otherName === "") {
            text.push("Name (Others)");
        }

        if (info.address === "") {
            text.push("Address")
        }

        if (text.length > 0) {
            let textString = "";

            text.forEach((string, index) => {
                textString += string;

                if (index !== text.length - 1) {
                    textString += ", ";
                }
            })

            // console.log(textString);

            MySwal.fire({
                title: <p>Please insert the data.</p>,
                text: textString,
                allowOutsideClick: false,
                confirmButtonColor: '#800000',
            })

            valid = false;
        }

        return valid;
    }

    // submit data function
    const submitData = async() => {
        const valid = checkValidInput();

        setLoading(true);

        // only allow submission if geolocation is enabled
        if (isGeolocationEnabled && valid) {
            // create deal
            const dealId = await dealCreate(12, "C12:NEW", "SALE");

            if (addInfoPic) {
                // process image
                await dealImageUpdate(dealId);
            }

            if (dealId) {
                var count = 0;

                if (info.activity !== "1076") {
                    // process non-stocklist products
                    ifProducts.map(async(ifProduct) => {
                        await productToList(ifProduct,  dealId, "IF", count++);
                    });
            
                    cpProducts.map(async(cpProduct) => {
                        await productToList(cpProduct,  dealId, "CP", count++);
                    });
                } else {
                    // process stocklist products
                    stockProducts.map(async(stockProduct) => {
                        await productToList(stockProduct,  dealId, "STOCK", count++);
                    });
                }
            }

            setLoading(false);

            if (userId !== null) {
                MySwal.fire({
                    title: <p>Uploaded successfully.</p>,
                    allowOutsideClick: false,
                    confirmButtonColor: '#000000',
                }).then(function() {
                    window.location.reload();
                })
            } else {
                MySwal.fire({
                    title: <p>Uploaded successfully.</p>,
                    text: 'You do not have a Bitrix24 login. Your sales visit data has been assigned to system administrator.',
                    allowOutsideClick: false,
                    confirmButtonColor: '#000000',
                }).then(function() {
                    window.location.reload();
                })
            }
        } else {
            setLoading(false);

            if (valid) {
                MySwal.fire({
                    title: <p>Please enable location permission.</p>,
                    allowOutsideClick: false,
                    confirmButtonColor: '#800000',
                })
            }
        }
    }

    return (
        <Container>
            <Row className='justify-content-center'>
                <Col sm={12} md={9} lg={7} xl={6} xxl={5} className='form-outer-box'>
                    <Header username={user.name} />  

                    {/*-------------------- Customer Type Selector --------------------*/}
                    <Container className='form-box mb-3'>
                        <Row className='tab-title justify-content-center mb-3'>
                            Customer Type
                        </Row>

                        <Row className='justify-content-center mb-2'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                <FloatingLabel label='Customer Type'>
                                    <Form.Select 
                                        value={type}
                                        onChange={(event) => handleTypeChange(event.target.value)}>
                                        <option value="" hidden disabled></option>
                                        <option>Outlet</option>
                                        <option>End Customer</option>
                                        <option>Distributor</option>
                                        <option>Grosir</option>
                                    </Form.Select>
                                </FloatingLabel>
                            </Col>
                        </Row>
                    </Container>
                    
                    {/*------------------------------ Customer Info Tab ------------------------------*/}
                    <Container className='form-box mb-3'>
                        <Row className='tab-title justify-content-center mb-3'>
                            {type} Info
                        </Row>

                        <Row className='justify-content-center mb-2'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                <FloatingLabel label='Activities'>
                                    <Form.Select 
                                        name='activity'
                                        value={info.activity}
                                        onChange={(event) => handleInfoChange('information', event)}>
                                        <option value="" hidden disabled></option>
                                        <option value="354">Regular Visit</option>
                                        <option value="122">Sampling</option>
                                        <option value="1208">Selling</option>
                                        <option value="124">Selling - Blitz</option>
                                        <option value="1076">Stocklist</option>
                                        <option value="1078">Others</option>
                                    </Form.Select>
                                </FloatingLabel>
                            </Col>
                        </Row>

                        <Row className='justify-content-center mb-2'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                <FloatingLabel label={'Activity Date'}>
                                    <Form.Control 
                                        required 
                                        name='date'
                                        type="date"
                                        value={info.date}
                                        onChange={(event) => handleInfoChange('information', event)} />
                                </FloatingLabel>
                            </Col>
                        </Row>

                        { info.activity === "1078" ?
                            <Row className='justify-content-center mb-2'>
                                <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                    <FloatingLabel label={'Activities (Others)'}>
                                        <Form.Control 
                                            required 
                                            name='otherActivity'
                                            type="span"
                                            value={info.otherActivity}
                                            onChange={(event) => handleInfoChange('information', event)} />
                                    </FloatingLabel>
                                </Col>
                            </Row> : null
                        }
                        
                        <Row className='justify-content-center mb-2'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                <FloatingLabel label={'Status ' + type}>
                                    { type === "Outlet" ?
                                        <Form.Select 
                                            name='status'
                                            value={info.status}
                                            onChange={(event) => handleInfoChange('information', event)}>
                                            <option value="" hidden disabled></option>
                                            <option value="126">New Open Outlet</option>
                                            <option value="128">Regular Outlet</option>
                                            <option value="138">Potential Outlet</option>
                                        </Form.Select> : null
                                    }
                                    
                                    { type === "End Customer" ?
                                        <Form.Select 
                                            name='status'
                                            value={info.status}
                                            onChange={(event) => handleInfoChange('information', event)}>
                                            <option value="" hidden disabled></option>
                                            <option value="1082">New Open End Customer</option>
                                            <option value="1084">Regular End Customer</option>
                                            <option value="1086">Potential End Customer</option>
                                        </Form.Select> : null
                                    }

                                    { type === "Distributor" ?
                                        <Form.Select 
                                            name='status'
                                            value={info.status}
                                            onChange={(event) => handleInfoChange('information', event)}>
                                            <option value="" hidden disabled></option>
                                            <option value="1088">New Open Distributor</option>
                                            <option value="1090">Regular Distributor</option>
                                            <option value="1092">Potential Distributor</option>
                                        </Form.Select> : null
                                    }

                                    { type === "Grosir" ?
                                        <Form.Select 
                                            name='status'
                                            value={info.status}
                                            onChange={(event) => handleInfoChange('information', event)}>
                                            <option value="" hidden disabled></option>
                                            <option value="1202">New Open Grosir</option>
                                            <option value="1204">Regular Grosir</option>
                                            <option value="1206">Potential Grosir</option>
                                        </Form.Select> : null
                                    }
                                </FloatingLabel>
                            </Col>
                        </Row>

                        <Row className='justify-content-center'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                <FloatingLabel className='mb-2' label='Company'>
                                    <Form.Control
                                        disabled
                                        value={user.company}/>
                                </FloatingLabel>

                                <FloatingLabel className='mb-2' label={type + ' Name'}>
                                    <Form.Select 
                                        required
                                        name='name'
                                        value={info.name}
                                        onChange={(event) => handleInfoChange('information', event)}>
                                        <option value="" hidden disabled></option>
                                        
                                        {customers.map((customer, index) => (
                                            type === "Outlet" && customer["TYPE_ID"] !== "UC_6LOEKK" ? 
                                                <option key={index}>{customer["name"]}</option> : 
                                            type === "End Customer" && customer["TYPE_ID"] !== "UC_IW244H" ? 
                                                <option key={index}>{customer["name"]}</option> : 
                                            type === "Grosir" && customer["TYPE_ID"] !== "UC_IUTT6Z" ?
                                            <option key={index}>{customer["name"]}</option> :
                                            type === "Distributor" && customer["TYPE_ID"] === "UC_3NYFOE" ? 
                                                <option key={index}>{customer["NAME"]}</option> :
                                            type === "Outlet" && info.activity === "124" && customer["TYPE_ID"] === "UC_3NYFOE" ?
                                                <option key={index}>{customer["NAME"]}</option> : null
                                        ))}

                                        <option>Others</option>
                                    </Form.Select>
                                </FloatingLabel>

                                { info.name === "Others" ?
                                    <FloatingLabel className='mb-2' label={type + ' Name (Others)'}>
                                        <Form.Control 
                                            required
                                            name='otherName'
                                            type="span"
                                            value={info.otherName}
                                            onChange={(event) => handleInfoChange('information', event)} />
                                    </FloatingLabel> : null
                                }
                            </Col>
                        </Row>

                        { info.name && type === 'End Customer' ?
                            <Row className='justify-content-center'>
                                <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                    <FloatingLabel className='mb-2' label='Type of Business'>
                                        <Form.Select 
                                            required
                                            name='typeOfBusiness'
                                            value={info.typeOfBusiness}
                                            onChange={(event) => handleInfoChange('information', event)}>
                                            <option value="" hidden disabled></option>
                                            <option value="1220">BISKUIT</option>
                                            <option value="1222">BOLU/CAKE</option>
                                            <option value="1224">BREAD CRUMB</option>
                                            <option value="1226">CAFE/RESTORAN/HOTEL</option>
                                            <option value="1228">CAKWE</option>
                                            <option value="1230">DONAT</option>
                                            <option value="1232">GORENGAN</option>
                                            <option value="1234">JALANGKOTE</option>
                                            <option value="1236">KEBAB</option>
                                            <option value="1238">KERUPUK</option>
                                            <option value="1240">FRIED CHICKEN/AYAM GORENG TEPUNG</option>
                                            <option value="1242">KUE JAJANAN PASAR</option>
                                            <option value="1244">KULIT LUMPIA</option>
                                            <option value="1246">KULIT PANGSIT</option>
                                            <option value="1248">LUMPIA</option>
                                            <option value="1250">MACARONI</option>
                                            <option value="1252">MARTABAK</option>
                                            <option value="1254">MIE BASAH</option>
                                            <option value="1256">MIE KERING</option>
                                            <option value="1258">PAO</option>
                                            <option value="1260">PEMPEK/SIOMAY</option>
                                            <option value="1262">PIA</option>
                                            <option value="1264">PLAIN TOAST BREAD</option>
                                            <option value="1266">ROTI/BUNS/BAKERY</option>
                                            <option value="1268">SNACK/KUE KERING</option>
                                            <option value="1270">SWEET BREAD</option>
                                            <option value="1272">TAPOYAKI</option>
                                            <option value="1274">TERANG BULAN</option>
                                            <option value="1276">TORTILLA SKIN</option>
                                            <option value="1278">WARUNG MAKAN/WARTEG</option>
                                            <option value="1280">WET NOODLE</option>
                                            <option value="1282">DRY NOODLE</option>
                                            <option value="1284">FRESH NOODLE</option>
                                            <option value="1286">OTHERS</option>
                                        </Form.Select>
                                    </FloatingLabel>
                                </Col>
                            </Row> : null
                        }

                        { info.name ?
                            <Row className='justify-content-center mb-2'>
                                <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                    <FloatingLabel className='mb-2' label='Area'>
                                        <Form.Select 
                                            required
                                            name='area'
                                            value={info.area}
                                            onChange={(event) => handleInfoChange('information', event)}>
                                            <option value="" hidden disabled></option>

                                            {areas.map((area, index) => (
                                                <option key={index}>{area.name}</option>
                                            ))}

                                            {/* <option value="620">Banjar</option>
                                            <option value="622">Banjarsari</option>
                                            <option value="624">Banten</option>
                                            <option value="626">Bekasi</option>
                                            <option value="628">Bogor</option>
                                            <option value="630">Ciamis</option>
                                            <option value="632">Cilegon</option>
                                            <option value="634">Cirebon</option>
                                            <option value="636">Depok</option>
                                            <option value="638">Garut</option>
                                            <option value="640">Indramayu</option>
                                            <option value="642">Jakarta Barat</option>
                                            <option value="644">Jakarta Pusat</option>
                                            <option value="646">Jakarta Selatan</option>
                                            <option value="648">Jakarta Timur</option>
                                            <option value="650">Jakarta Utara</option>
                                            <option value="652">Kabupaten Bandung</option>
                                            <option value="654">Kabupaten Bandung Barat</option>
                                            <option value="656">Karawang</option>
                                            <option value="658">Kota Bandung</option>
                                            <option value="660">Kota Cimahi</option>
                                            <option value="662">Kuningan</option>
                                            <option value="664">Lebak</option>
                                            <option value="666">Majalengka</option>
                                            <option value="668">Pandeglang</option>
                                            <option value="670">Pangandaran</option>
                                            <option value="672">Purwakarta</option>
                                            <option value="674">Serang</option>
                                            <option value="676">Subang</option>
                                            <option value="678">Sumedang</option>
                                            <option value="680">Tangerang</option>
                                            <option value="682">Tangerang Selatan</option>
                                            <option value="684">Tasik Malaya</option>
                                            <option value="994">Makassar</option>
                                            <option value="996">Gowa Takalar</option>
                                            <option value="998">Maros Pangkep</option> */}

                                            <option value="1080">Others</option>
                                        </Form.Select>
                                    </FloatingLabel>

                                    { info.area === "1080" ?
                                        <FloatingLabel className='mb-2' label={'Area (Others)'}>
                                            <Form.Control 
                                                required 
                                                name='otherArea'
                                                type="span"
                                                value={info.otherArea}
                                                onChange={(event) => handleInfoChange('information', event)} />
                                        </FloatingLabel> : null
                                    }

                                    <FloatingLabel className='mb-2' label={'Address ' + type}>
                                        { info.name !== "Others" && info.address ?
                                            <Form.Control 
                                                disabled
                                                name='address'
                                                value={info.address} /> :
                                            <Form.Control 
                                                required
                                                name='address'
                                                value={info.address}
                                                onChange={(event) => handleInfoChange('information', event)} />  
                                        }
                                    </FloatingLabel>

                                    <FloatingLabel className='mb-2' label='Outlet PIC/Owner'>
                                        <Form.Control 
                                            name='picOwner'
                                            type="span"
                                            value={info.picOwner}
                                            onChange={(event) => handleInfoChange('information', event)} />
                                    </FloatingLabel>

                                    <FloatingLabel className='mb-2' label='Phone Number (+62)'>
                                        <Form.Control 
                                            required 
                                            name='phone'
                                            type="string"
                                            value={info.phone}
                                            onChange={(event) => handleInfoChange('information', event)} />
                                    </FloatingLabel>
                                </Col>
                            </Row> : null
                        }

                        {/* <Row className='justify-content-center mb-2'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                
                            </Col>
                        </Row>

                        <Row className='justify-content-center mb-3'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                
                            </Col>
                        </Row> */}
                    </Container>

                    { info.activity !== "1076" && info.activity !== "1078" ?
                        <div>
                            {/*------------------------------ Interflour Info Tab ------------------------------*/}
                            <Container className='form-box mb-3'>
                                <Row className='tab-title justify-content-center mb-3'>
                                    Interflour Info
                                </Row>
                                
                                <Row className='justify-content-center mb-3'>
                                    {ifProducts.map((ifProduct, index) => (
                                        <Col key={index} className='mb-1' xs={11} sm={10} md={11} lg={11} xl={11}>
                                            { index === 0 ? null : <hr /> }

                                            <FloatingLabel className='mb-2' label={`Product Name ${index+1}`}>
                                                <Form.Select 
                                                    name='name'
                                                    value={ifProduct.name}
                                                    onChange={(event) => handleProductChange('interflour', index, event)}>
                                                    <option value="" hidden disabled></option>
                                                    
                                                    {ifProductList.map((ifProductItem, index) => (
                                                        <option key={index}>{ifProductItem["NAME"]}</option>
                                                    ))}
                                                </Form.Select>
                                            </FloatingLabel>

                                            <FloatingLabel className='mb-2' label='UoM'>
                                                <Form.Control
                                                    name='uom' 
                                                    disabled
                                                    value={ifProduct.uom}/>
                                            </FloatingLabel>
                                            
                                            {/* <FloatingLabel className='mb-2' label='UoM'>
                                                <Form.Select 
                                                    name='uom'
                                                    value={ifProduct.uom}
                                                    onChange={(event) => handleProductChange('interflour', index, event)}>
                                                    <option value="" hidden disabled></option>
                                                    <option>BAG</option>
                                                    <option>BOX</option>
                                                    <option>KG</option>
                                                    <option>GRAM</option>
                                                </Form.Select>
                                            </FloatingLabel> */}

                                            <FloatingLabel className='mb-2' label='Quantity'>
                                                <Form.Control 
                                                    name='quantity'
                                                    type="number"
                                                    min="0"
                                                    value={ifProduct.quantity}
                                                    onChange={(event) => handleProductChange('interflour', index, event)} />
                                            </FloatingLabel>

                                            
                                            <InputGroup className='mb-2'>    
                                                <FloatingLabel label='Monthly Capacity'>
                                                    <Form.Control
                                                        name='capacity' 
                                                        type="number" 
                                                        min={0} 
                                                        value={ifProduct.capacity}
                                                        onChange={(event) => handleProductChange('interflour', index, event)} />
                                                </FloatingLabel>

                                                <DropdownButton
                                                    variant="outline-secondary"
                                                    title={ifProduct.capacityUnit}>
                                                    <Dropdown.Item name="capacityUnit" value="KG" onClick={(event) => handleProductChange('interflour', index, event)}>KG</Dropdown.Item>
                                                    <Dropdown.Item name="capacityUnit" value="Ton" onClick={(event) => handleProductChange('interflour', index, event)}>Ton</Dropdown.Item>
                                                </DropdownButton>
                                            </InputGroup>
                                            
                                 

                                            <FloatingLabel className='mb-2' label='Selling Price'>
                                                <Form.Control
                                                    name='sellingPrice' 
                                                    type="number" 
                                                    min={0} 
                                                    value={ifProduct.sellingPrice}
                                                    onChange={(event) => handleProductChange('interflour', index, event)} />
                                            </FloatingLabel>

                                            <FloatingLabel className='mb-2' label='Buying Price'>
                                                <Form.Control
                                                    name='buyingPrice' 
                                                    type="number" 
                                                    min={0} 
                                                    value={ifProduct.buyingPrice}
                                                    onChange={(event) => handleProductChange('interflour', index, event)} />
                                            </FloatingLabel>

                                            { ifProducts.length > 1 ?
                                                <Button variant="danger" onClick={(event) => removeProduct("interflour", index)}>Remove product {index+1}</Button> : ''
                                            }
                                        </Col>
                                    ))}
                                </Row>

                                <Row className='justify-content-center mb-3'>
                                    <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                        <Button onClick={() => addProduct("interflour")} variant="dark">Add</Button>
                                    </Col>
                                </Row>
                            </Container>

                            {/*------------------------------ Competitor Info Tab ------------------------------*/}
                            { info.activity !== "124" ?
                                <Container className='form-box mb-3'>
                                    <Row className='tab-title justify-content-center mb-3'>
                                        Competitor Info
                                    </Row>
                                    
                                    <Row className='justify-content-center mb-3'>
                                        {cpProducts.map((cpProduct, index) => (
                                            <Col key={index} className='mb-1' xs={11} sm={10} md={11} lg={11} xl={11}>
                                                { index === 0 ? '' : <hr /> }
                                            
                                                <FloatingLabel className='mb-2' label={`Product Name ${index+1}`}>
                                                    <Form.Select 
                                                        name='name'
                                                        value={cpProduct.name}
                                                        onChange={(event) => handleProductChange('competitor', index, event)}>
                                                        <option value="" hidden disabled></option>

                                                        {cpProductList.map((cpProductItem, index) => (
                                                            <option key={index}>{cpProductItem["NAME"]}</option>
                                                        ))}
                                                    </Form.Select>
                                                </FloatingLabel>
                                                
                                                <FloatingLabel className='mb-2' label='UoM'>
                                                    <Form.Select 
                                                        name='uom'
                                                        value={cpProduct.uom}
                                                        onChange={(event) => handleProductChange('competitor', index, event)}>
                                                        <option value="" hidden disabled></option>
                                                        <option>BAG</option>
                                                        <option>BOX</option>
                                                        <option>KG</option>
                                                        <option>GRAM</option>
                                                    </Form.Select>
                                                </FloatingLabel>

                                                <FloatingLabel className='mb-2' label='Quantity'>
                                                    <Form.Control 
                                                        name='quantity'
                                                        type="number" 
                                                        min={0} 
                                                        value={cpProduct.quantity}
                                                        onChange={(event) => handleProductChange('competitor', index, event)} />
                                                </FloatingLabel>

                                                <FloatingLabel className='mb-2' label='Selling Price'>
                                                    <Form.Control 
                                                        name='sellingPrice'
                                                        type="number"
                                                        min={0} 
                                                        value={cpProduct.sellingPrice}
                                                        onChange={(event) => handleProductChange('competitor', index, event)} />
                                                </FloatingLabel>

                                                <FloatingLabel className='mb-2' label='Buying Price'>
                                                    <Form.Control 
                                                        name='buyingPrice'
                                                        type="number"
                                                        min={0} 
                                                        value={cpProduct.buyingPrice}
                                                        onChange={(event) => handleProductChange('competitor', index, event)} />
                                                </FloatingLabel>

                                                { cpProducts.length > 1 ?
                                                    <Button variant="danger" onClick={(event) => removeProduct("competitor", index)}>Remove product {index+1}</Button> : ''
                                                }
                                            </Col>
                                        ))}
                                    </Row>

                                    <Row className='justify-content-center mb-3'>
                                        <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                            <Button onClick={() => addProduct("competitor")} variant="dark">Add</Button>
                                        </Col>
                                    </Row>
                                    
                                    <Row className='justify-content-center mb-2'>
                                        <Col className='mb-1' xs={11} sm={10} md={11} lg={11} xl={11}>
                                            <hr />

                                            <FloatingLabel className='mb-2' label='Product Supplied by'>
                                                <Form.Control 
                                                    name='name'
                                                    value={cpInfo.name}
                                                    onChange={(event) => handleInfoChange('competitor', event)} />
                                            </FloatingLabel>

                                            <FloatingLabel className='mb-2' label='Supplier Address'>
                                                <Form.Control 
                                                    name='address'
                                                    value={cpInfo.address}
                                                    onChange={(event) => handleInfoChange('competitor', event)} />
                                            </FloatingLabel>

                                            <FloatingLabel className='mb-2' label='Stockiest Name'>
                                                <Form.Control
                                                    name='stockiest'
                                                    value={cpInfo.stockiest}
                                                    onChange={(event) => handleInfoChange('competitor', event)} />
                                            </FloatingLabel>

                                            <FloatingLabel className='mb-2' label='Nearby Market Name'>
                                                <Form.Control
                                                    name='market'
                                                    value={cpInfo.market}
                                                    onChange={(event) => handleInfoChange('competitor', event)} />
                                            </FloatingLabel>
                                        </Col>
                                    </Row>
                                </Container> : null
                            }
                        </div> : null
                    }

                    { info.activity === "1076" ?
                        <div>
                            {/*-------------------- Stocklist activity --------------------*/}
                            <Container className='form-box mb-3'>
                                <Row className='tab-title justify-content-center mb-3'>
                                    Stocklist Info
                                </Row>
                                
                                <Row className='justify-content-center mb-3'>
                                    {stockProducts.map((stockProduct, index) => (
                                        <Col key={index} className='mb-1' xs={11} sm={10} md={11} lg={11} xl={11}>
                                            { index === 0 ? null : <hr /> }

                                            <FloatingLabel className='mb-2' label='Stock Type'>
                                                <Form.Select 
                                                    name='type'
                                                    value={stockProduct.type}
                                                    onChange={(event) => handleProductChange('stocklist', index, event)}>
                                                    <option value="" hidden disabled></option>
                                                    <option>Beginning Stock</option>
                                                    <option>Sell In</option>
                                                    <option>Sell Out</option>
                                                    <option>Balance Stock</option>
                                                </Form.Select>
                                            </FloatingLabel>

                                            <FloatingLabel className='mb-2' label={`Product Name ${index+1}`}>
                                                <Form.Select 
                                                    name='name'
                                                    value={stockProduct.name}
                                                    onChange={(event) => handleProductChange('stocklist', index, event)}>
                                                    <option value="" hidden disabled></option>
                                                    
                                                    {stockProductList.map((stockProductItem, index) => (
                                                        <option key={index}>{stockProductItem["NAME"]}</option>
                                                    ))}
                                                </Form.Select>
                                            </FloatingLabel>

                                            <FloatingLabel className='mb-2' label='Product Code'>
                                                <Form.Control
                                                    name='code' 
                                                    disabled
                                                    value={stockProduct.code}/>
                                            </FloatingLabel>

                                            <FloatingLabel className='mb-2' label='UoM'>
                                                <Form.Control
                                                    name='uom' 
                                                    disabled
                                                    value={stockProduct.uom}/>
                                            </FloatingLabel>

                                            {/* <FloatingLabel className='mb-2' label='UoM'>
                                                <Form.Select 
                                                    name='uom'
                                                    value={stockProduct.uom}
                                                    onChange={(event) => handleProductChange('stocklist', index, event)}>
                                                    <option value="" hidden disabled></option>
                                                    <option>25KG</option>
                                                    <option>01KG</option>
                                                    <option>0.5KG</option>
                                                    <option>0.25KG</option>
                                                </Form.Select>
                                            </FloatingLabel> */}

                                            <FloatingLabel className='mb-2' label='Quantity (bag)'>
                                                <Form.Control 
                                                    name='quantity'
                                                    type="number"
                                                    min="0"
                                                    value={stockProduct.quantity}
                                                    onChange={(event) => handleProductChange('stocklist', index, event)} />
                                            </FloatingLabel>

                                            { stockProducts.length > 1 ?
                                                <Button variant="danger" onClick={(event) => removeProduct("stocklist", index)}>Remove product {index+1}</Button> : ''
                                            }
                                        </Col>
                                    ))}
                                </Row>

                                <Row className='justify-content-center mb-3'>
                                    <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                        <Button onClick={() => addProduct("stocklist")} variant="dark">Add</Button>
                                    </Col>
                                </Row>
                            </Container>
                        </div> :
                        <Container className='form-box mb-3'>
                            {/*------------------------------ Additional Info Tab ------------------------------*/}
                            <Row className='tab-title justify-content-center mb-3'>
                                Additional Info
                            </Row>
                            
                            <Row className='justify-content-center mb-3'>
                                <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                    {/* <FloatingLabel className='mb-2' label={'Resume from ' + type}>
                                        <Form.Select 
                                            name='resume'
                                            value={addInfo.resume}
                                            onChange={(event) => handleInfoChange('additional', event)}>
                                            <option value="" hidden disabled></option>
                                            <option value="256">Give sample no feedback yet</option>
                                            <option value="258">Quality Accept & Order</option>
                                            <option value="260">Quality Accept & Hold</option>
                                            <option value="262">No Order Quality Issue</option>
                                            <option value="264">No Order Price Issue</option>
                                            <option value="266">No Order High Stock</option>
                                            <option value="268">Need Further Visit</option>
                                        </Form.Select>
                                    </FloatingLabel> */}

                                    <FloatingLabel className='mb-2' label='Additional Notes'>
                                        <Form.Control 
                                            name="notes"
                                            type="text" 
                                            min={0}
                                            value={addInfo.notes}
                                            onChange={(event) => handleInfoChange('additional', event)} />
                                    </FloatingLabel>

                                    <FloatingLabel className='mb-2' label='Picture'>
                                        <Form.Control 
                                            name="picture"
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            value={addInfo.picture}
                                            onChange={(event) => handleInfoChange('additional', event)} />
                                    </FloatingLabel>
                                </Col>
                            </Row>
                        </Container>
                    }

                    {/*-------------------- Submit Button --------------------*/}
                    <Container className='form-submit-box'>
                        <Row className='justify-content-center'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                <Button variant="warning" onClick={submitData}>
                                    Submit
                                </Button>
                            </Col>
                        </Row>
                    </Container>
                </Col>
            </Row>
            
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Container>
    )
}

export default HomeForm