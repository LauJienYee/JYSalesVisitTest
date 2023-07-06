import axios from 'axios';
import React, { useEffect } from 'react'

const ThanksPage = () => {
    useEffect(() => {
        async function callApi() {
            var url=
                "https://bitrix.fusioneta.com/rest/1/2b1ahpure84sq10u/crm.contact.add.json?FIELDS[NAME]=test&FIELDS[LAST_NAME]=test";

            try {
                const cp_res = await axios.get(url);
                const cp_res_data = await cp_res.data;

                if (cp_res_data) {
                    console.log(cp_res_data);
                }
                // return JSON.parse(res_data.result);
            } catch (error) {
                console.log(error);
                return 0;
            }
        }
        
        callApi();
    }, [])
    
    return (
        <div>
            <h1>Thank you.</h1>
        </div>
    )
}

export default ThanksPage