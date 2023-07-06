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
import { collection, query, where, getDocs /* doc, setDoc */ } from "firebase/firestore"
import { useNavigate } from 'react-router-dom'

const MySwal = withReactContent(Swal);

const FeedbackForm = ({ parentDealId }) => {
    const navigate = useNavigate();
    // logged in user
    const [user, setUser] = useState({ name: "", email: "", company: "", empId: "" });
    const [userId, setUserId] = useState(null);
    // loading status
    const [loading, setLoading] = useState(false);
    // feedback info
    const [info, setInfo] = useState({ date: "", usedProduct: "", acceptedProduct: "", feedbackInfo: "", otherInfo: "" })
    // info picture
    const [infoPic, setInfoPic] = useState({});
    // parentDeal info
    const [parentDeal, setParentDeal] = useState({}); 

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
        }

        fetchUserArea();
    }, [user.company]);

    useEffect(() => {
        async function fetchParentDeal() {
            const url=
                "https://interflour.bitrix24.com/rest/162/t62lt5md1sv7jhd4/crm.deal.get.json?ID=" + parentDealId;

            var res = await axios.get(url);
            var res_data = await res.data;

            if (res_data) {
                setParentDeal(res_data.result);
            }
        }

        fetchParentDeal();
    }, [parentDealId])

    // fetch interflour and competitor product from Bitrix24 List
    useEffect(() => {
        async function fetchUserId() {
            var userEmail = '';
            var res = '';

            if (auth.currentUser) {
                userEmail = auth.currentUser.email;
            }

            console.log("looking for " + userEmail);

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

        fetchUserId();
    }, [])

    // handle customer info, competitor info, additional info change
    const handleInfoChange = (event) => {
        console.log("setting info: " + event.target.name + " to : " + event.target.value);

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

                        setInfoPic(documents);
                    }
                }
            }
        } else if (event.target.name === "usedProduct") {
            if (event.target.value === "No") {
                setInfo({...info, [event.target.name]: event.target.value, acceptedProduct: "", feedbackInfo: "", otherInfo: "" });
            } else {
                setInfo({...info, [event.target.name]: event.target.value})
            }
        } else if (event.target.name === "acceptedProduct") {
            setInfo({...info, [event.target.name]: event.target.value, feedbackInfo: "", otherInfo: "" });
        } else {
            setInfo({...info, [event.target.name]: event.target.value})
        }
    }

    const checkValidInput = () => {
        let valid = true;
        let text = [];

        // if (info.activity === "") {
        //     text.push("Activity");
        // } else if (info.activity === "Others" && info.otherActivity === "") {
        //     text.push("Activity (Others)");
        // }

        // if (info.area === "") {
        //     text.push("Area");
        // } else if (info.area === "1080" && info.otherArea === "") {
        //     text.push("Area (Others)");
        // }

        // if (info.name === "") {
        //     text.push("Name");
        // } else if (info.name === "Others" && info.otherName === "") {
        //     text.push("Name (Others)");
        // }

        // if (info.address === "") {
        //     text.push("Address")
        // }

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

    // create deal in Bitrix24
    const dealCreate = async(categoryId, stageId, typeId) => {
        // sales type in Bitrix24
        const location = coords.latitude + ", " + coords.longitude;
        const userID = userId === null ? 106 : userId;
        const usedProductCode = info.usedProduct === "Yes" ? 1106 : 1108;
        const acceptedCode = info.acceptedProduct === "Accepted" ? 1110 : info.acceptedProduct === "Rejected" ? 1112 : "";
        const feedback = info.feedbackInfo === "Others" ? info.otherInfo : info.feedbackInfo;

        // changing date format to match Bitrix24 api requirement
        let preDate = "";
        let date = "";

        if (info.date === "") {
            const currentDate = new Date();
            date = (currentDate.getMonth() + 1) + '/' + currentDate.getDate() + '/' + currentDate.getFullYear();
            // console.log(date);
        } else {
            preDate = info.date.split("-");
            date = preDate[1] + '/' + preDate[2] + '/' + preDate[0];
        }

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
            "&FIELDS[UF_CRM_1665043341317]=" + parentDeal['UF_CRM_1665043341317'] +
            "&FIELDS[UF_CRM_1665453740489]=" + location +
            "&FIELDS[UF_CRM_1646715948407]=" + 122 +
            "&FIELDS[UF_CRM_1646717095792]=" + parentDeal['UF_CRM_1646717095792'] +
            "&FIELDS[UF_CRM_1646715886722]=" + parentDeal['UF_CRM_1646715886722'] +
            "&FIELDS[UF_CRM_1667525337365]=" + parentDeal['UF_CRM_1667525337365'] +
            "&FIELDS[UF_CRM_1667526378127]=" + parentDeal['UF_CRM_1667526378127'] +
            "&FIELDS[UF_CRM_1650428523146]=" + parentDeal['UF_CRM_1650428523146'] +
            "&FIELDS[UF_CRM_1661757945]=" + parentDeal['UF_CRM_1661757945'] +
            "&FIELDS[UF_CRM_1667196830833]=" + parentDeal['UF_CRM_1667196830833'] +
            "&FIELDS[UF_CRM_1667456975955]=" + date +
            "&FIELDS[UF_CRM_1646710147809]=" + parentDeal['UF_CRM_1646710147809'] +
            "&FIELDS[UF_CRM_1650504559499]=" + parentDeal['UF_CRM_1650504559499'] +
            "&FIELDS[UF_CRM_1646710085351]=" + parentDeal['UF_CRM_1646710085351'] +
            "&FIELDS[UF_CRM_1646710071665]=" + parentDeal['UF_CRM_1646710071665'] +
            "&FIELDS[UF_CRM_1646717224176]=" + parentDeal['UF_CRM_1646717224176'] +
            "&FIELDS[UF_CRM_1667528423355]=" + parentDeal['UF_CRM_1667528423355'] +
            "&FIELDS[UF_CRM_1670404685]=" + parentDealId +
            "&FIELDS[UF_CRM_1671783706035]=" + usedProductCode +
            "&FIELDS[UF_CRM_1671783759616]=" + acceptedCode +
            "&FIELDS[UF_CRM_1671784001765]=" + feedback;
        
        try {
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
                        "fileData": infoPic[0]
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

    // submit data function
    const submitData = async() => {
        const valid = checkValidInput();

        setLoading(true);

        // only allow submission if geolocation is enabled
        if (isGeolocationEnabled && valid) {
            // create deal
            const dealId = await dealCreate(12, "C12:NEW", "SALE");

            if (infoPic) {
                // process image
                await dealImageUpdate(dealId);
            }

            setLoading(false);

            if (userId !== null) {
                MySwal.fire({
                    title: <p>Feedback uploaded successfully.</p>,
                    allowOutsideClick: false,
                    confirmButtonColor: '#000000',
                }).then(function() {
                    navigate('/home');
                    window.location.reload();
                })
            } else {
                MySwal.fire({
                    title: <p>Feedback uploaded successfully.</p>,
                    text: 'You do not have a Bitrix24 login. Your sales visit data has been assigned to system administrator.',
                    allowOutsideClick: false,
                    confirmButtonColor: '#000000',
                }).then(function() {
                    navigate('/home');
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

                    {/*-------------------- Feedback Info --------------------*/}
                    <Container className='form-box mb-3'>
                        <Row className='tab-title justify-content-center mb-3'>
                            Feedback Info
                        </Row>

                        <Row className='justify-content-center mb-2'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                <FloatingLabel label={'Activity Date'}>
                                    <Form.Control 
                                        required 
                                        name='date'
                                        type="date"
                                        value={info.date}
                                        onChange={(event) => handleInfoChange(event)} />
                                </FloatingLabel>
                            </Col>
                        </Row>

                        <Row className='justify-content-center mb-2'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                <FloatingLabel className='feedback-title' label='Apakah sample yang kami berikan sudah digunakan?'>
                                    <Form.Select 
                                        name='usedProduct'
                                        value={info.usedProduct}
                                        onChange={(event) => handleInfoChange(event)}>
                                        <option value="" hidden disabled></option>
                                        <option value="Yes">Ya</option>
                                        <option value="No">Tidak</option>
                                    </Form.Select>
                                </FloatingLabel>
                            </Col>
                        </Row>
                        

                        { info.usedProduct === "Yes" ?
                            <Row className='justify-content-center mb-2'>
                                <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                    <FloatingLabel label='Tanggapan anda?'>
                                        <Form.Select 
                                            name='acceptedProduct'
                                            value={info.acceptedProduct}
                                            onChange={(event) => handleInfoChange(event)}>
                                            <option value="" hidden disabled></option>
                                            <option value="Accepted">Sample OK</option>
                                            <option value="Rejected">Sample Tidak Bagus</option>
                                        </Form.Select>
                                    </FloatingLabel>
                                </Col>
                            </Row> : null
                        }

                        { info.acceptedProduct === "Accepted" ?
                            <Row className='justify-content-center mb-2'>
                                <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                    <FloatingLabel label={'Sample OK - Berikan Alasan'}>
                                        <Form.Select 
                                            name='feedbackInfo'
                                            value={info.feedbackInfo}
                                            onChange={(event) => handleInfoChange(event)}>
                                            <option value="" hidden disabled></option>
                                            <option>Sample OK - Order/Beli Produk</option>
                                            <option>Sample OK - Order/Beli Produk (Jadi Produk Pilihan Utama)</option>
                                            <option>Sample OK - Tidak Order/Beli Produk (Fanatik Produk Kompetitor)</option>
                                            <option>Sample OK - Tidak Order/Beli Produk (Stok Masih Ada)</option>
                                            <option>Sample OK - Tidak Order/Beli Produk (Harga Kemahalan)</option>
                                            <option>Sample OK - Tanpa Alasan Yang Jelas</option>
                                            <option>Others</option>
                                        </Form.Select>
                                    </FloatingLabel>
                                </Col>
                            </Row> : info.acceptedProduct === "Rejected" ?
                            <Row className='justify-content-center mb-2'>
                                <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                    <FloatingLabel label={'Sample Tidak Bagus - Berikan Alasan'}>
                                        <Form.Select 
                                            name='feedbackInfo'
                                            value={info.feedbackInfo}
                                            onChange={(event) => handleInfoChange(event)}>
                                            <option value="" hidden disabled></option>
                                            <option>Sample Tidak Bagus - Kwalitas Produk Yang Dihasilkan Tidak Mengembang</option>
                                            <option>Sample Tidak Bagus - Kwalitas Produk Yang Dihasilkan Kusam/Tidak Menarik</option>
                                            <option>Sample Tidak Bagus - Kwalitas Produk Yang Dihasilkan Keras</option>
                                            <option>Sample Tidak Bagus - Tanpa Alasan Yang Jelas</option>
                                            <option>Others</option>
                                        </Form.Select>
                                    </FloatingLabel>
                                </Col>
                            </Row> : null                        
                        }

                        { info.feedbackInfo === "Others" ?
                            <Row className='justify-content-center mb-2'>
                                <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                    <FloatingLabel label={`${info.acceptedProduct} Information (Others)`}>
                                        <Form.Control 
                                            required 
                                            name='otherInfo'
                                            type="span"
                                            value={info.otherInfo}
                                            onChange={(event) => handleInfoChange(event)} />
                                    </FloatingLabel>
                                </Col>
                            </Row> : null
                        }

                        <Row className='justify-content-center mb-2'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                <FloatingLabel className='mb-2' label='Picture'>
                                    <Form.Control 
                                        name="picture"
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        value={info.picture}
                                        onChange={(event) => handleInfoChange(event)} />
                                </FloatingLabel>
                            </Col>
                        </Row>
                    </Container>

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

export default FeedbackForm 