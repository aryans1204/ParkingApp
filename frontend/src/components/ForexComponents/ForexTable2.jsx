import React, {useState, useEffect} from 'react';
import { Input, InputGroup, InputLeftElement, Button,
    Table, Thead, Tbody, Tr, 
    Th, Td, TableContainer,} from '@chakra-ui/react';
    import { SearchIcon } from '@chakra-ui/icons';
import classes from '../Forex.module.css';
import RecentGraph from './RecentGraph';


function ForexTable2 () {
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [num, setNum] = useState(0);
    const [hasData, setHasData] = useState(false);
    const [dataChange, setDataChange] = useState(false);


    function checkData () {
        fetch('/api/currencies', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionStorage.getItem("token")}`
            }
        })
        .then((response) => response.json())
        .then((data) => {
            // Checks there's entries
            if (data.length != 0) {
                setHasData(true);
                if (data.length >= 5) {setNum(5)}
                else {setNum(data.length)}
            }
            else {setNum(0)}
        })
        .catch((err) => {
            console.log(err.message);
        });
    }

    async function handleButton() {
        const inputElement = document.getElementById('myInput');
        var value = inputElement.value;
        if (value.length == 0) {
            alert("Empty input");
        }
        else {
            value = value.trim();
            let arr = value.split("/");
            arr = arr.map(element => {
                return element.trim();
            });
            let fromVar = arr[0].toUpperCase();
            let toVar = arr[1].toUpperCase();
            await postData(fromVar, toVar);
        }
        document.getElementById('myInput').value = '';
    }

    const getPair = async (fromVar, toVar) => {
        var myHeaders = new Headers();
        myHeaders.append("apikey", import.meta.env.VITE_FIXER_API_KEY);
      
        var requestOptions = {
            method: 'GET',
            redirect: 'follow',
            headers: myHeaders
        };
      
        var url = "https://api.apilayer.com/fixer/latest?base=" + fromVar + "&symbols=" + toVar;
        
        const response = await fetch(url, requestOptions);
        const result = await response.json();
        console.log("PAIR RESULT IS HERE", result);
        let key = String(Object.keys(result.rates));
        let rateData = result.rates[key].toFixed(2);
        var data = {from: fromVar, to: toVar, rate: rateData, change: null};
        return data;
    }

    const getFluc = async (fromVar, toVar) => {
        var myHeaders = new Headers();
        myHeaders.append("apikey", import.meta.env.VITE_FIXER_API_KEY);
    
        var requestOptions = {
            method: 'GET',
            redirect: 'follow',
            headers: myHeaders
        };
    
        // Get dates
        const curDate = new Date().toISOString().slice(0, 10);
        const lastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
        var url = "https://api.apilayer.com/fixer/fluctuation?start_date=" + lastDate + "&end_date=" + curDate + "&base=" + fromVar + "&symbols=" + toVar;
        
        const response = await fetch(url, requestOptions);
        var result = await response.json();
        result = result.rates;
        let key = String(Object.keys(result));
        let changeVal = result[key].change_pct; // take change_pct value
        return changeVal;
    }

    // calling for initial data and API data
    const setupData = async () => {
        checkData();

        if (localStorage.getItem("tableData") == null) {
            console.log("Getting initial data");
            try {
                const response = await fetch('/api/currencies', {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                  },
                });
          
                // Parase response data to get the 5 most recent entries
                const allData = await response.json();
                const sortedData = allData.sort((a, b) => {
                    if (a._id < b._id) {
                      return -1; // a should come before b
                    }
                    if (a._id > b._id) {
                      return 1; // a should come after b
                    }
                    return 0; // a and b are equal
                  });
                const data = await sortedData.slice(-5); // get the 5 most recent entries
                console.log("recent 5 data is ", data);
    
                // Getting currency pairs from sortedData
                const conversions = [];
                for (let i = 0; i < data.length; i++) {
                  const pair = { from: data[i].currency_from, to: data[i].currency_to };
                  conversions.push(pair);
                }
          
                // Getting responses for each currency pair (rate and fluctation)
                const responses = [];
                for (const { from, to } of conversions) {
                    //console.log(typeof(from), to);
                  const pairRes = await getPair(from, to);
                  const flucRes = await getFluc(from, to);
                //   console.log(pairRes); console.log("PAIR DATA HERE");
                //   console.log(flucRes); console.log("FLUC DATA HERE");
                  pairRes.change = flucRes;
                  const indivResp = [pairRes];
                //   console.log(indivResp); console.log("INDIV RESP");
                  responses.push(indivResp);
                }
    
                //console.log(responses); console.log("responses here");
    
                localStorage.setItem('tableData', JSON.stringify(responses));
                setTableData(responses);
                setIsDataFetched(true);
            }
            catch (error) {
                console.log(error.message);
            }
        }
        console.log("No need to get initial data");
        var storageData = localStorage.getItem("tableData");
        setTableData(JSON.parse(storageData));
        setIsDataFetched(true);
    }

    const fetchNewEntry = async (from, to) => {
        //console.log(fromData); console.log("sdfsdf");
        const pairRes = await getPair(from, to);
        const flucRes = await getFluc(from, to);
        pairRes.change = flucRes;
        const latestResp = [pairRes];
        console.log(latestResp); console.log("latestResp");

        var data = localStorage.getItem("tableData");
        data = JSON.parse(data);

        // if num < 5, push like normal
        if (num < 5) {
            data.push(latestResp);
        }
        else { // num >= 5
            var newData = data.slice(1);
            newData.push(latestResp);
            data = newData;
        }

        console.log(data); console.log("DATA HERE");
        localStorage.setItem("tableData", JSON.stringify(data));

        setTableData(data);
        setIsDataFetched(true);
    }

    async function postData(fromVar, toVar) {
        setDataChange(false);
        fetch('/api/currencies', {
            method: 'POST',
            body: JSON.stringify({
                currency_from: fromVar,
                currency_to: toVar
            }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionStorage.getItem("token")}`
            }
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(() => {console.log("Data posted successfully");
            // setToData(toVar);
            // setFromData(fromVar);
            setNum(num+1);
            setIsDataFetched(false);
            setDataChange(true);
            fetchNewEntry(fromVar, toVar);
        })
        .catch((err) => {
            console.log(err.message);
         });
    }

    useEffect(() => {
        setupData();
    }, [])

    useEffect(() => {
        <RecentGraph />
    }, [dataChange])

    // useEffect(() => {
    //     // get API data of last entry post
    //     const fetchNewEntry = async () => {
    //         console.log(fromData); console.log("sdfsdf");
    //         const pairRes = await getPair(fromData, toData);
    //         const flucRes = await getFluc(fromData, toData);
    //         pairRes.change = flucRes;
    //         const latestResp = [pairRes];
    //         //console.log(latestResp);

    //         const data = sessionStorage.getItem("tableData");
    //         data.push(latestResp);
    //         console.log(data); console.log("NEW DATA HERE");
    //         // const data = tableData;
    //         // data.push(latestResp);
    //         setTableData(data);
    //         setIsDataFetched(true);
    //     }
    //     fetchNewEntry();
    //   }, [num, isDataFetched]);
  
    if (!isDataFetched) {
      return (
        <>
        <div className={classes.div}>
            <div className={classes.search}>
                <InputGroup>
                <InputLeftElement
                    pointerEvents='none'
                    children={<SearchIcon color='gray.600' />}
                />
                <Input placeholder='Enter Currency Pair' htmlSize={50} width='auto' variant='filled' id="myInput"/>
                <Button colorScheme='purple' className={classes.button}>Search</Button>
                </InputGroup>
            </div>
        <p>Loading Table...</p>
        </div>
        </>
        )  
    }
  
    return (
        <div className={classes.div}>
            <div className={classes.search}>
                <InputGroup>
                <InputLeftElement
                    pointerEvents='none'
                    children={<SearchIcon color='gray.600' />}
                />
                <Input placeholder='Enter Currency Pair' htmlSize={50} width='auto' variant='filled' id="myInput"/>
                <Button colorScheme='purple' onClick={handleButton} className={classes.button}>Search</Button>
                </InputGroup>
            </div>
            <div>
                {/* Conditionally renders based on whether there is data in the database */}
                { hasData ? (
                    <div className={classes.currencyDiv}>
                    <TableContainer>
                        <Table variant='simple'>
                        <Thead>
                            <Tr>
                            <Th>Currency Pairs</Th>
                            <Th>Rate</Th>
                            <Th>Fluctuation</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {tableData.map((data, index) => (
                            <Tr key={index}>
                                <Td>{data[0].from}/{data[0].to}</Td>
                                <Td>{data[0].rate}</Td>
                                <Td>{(data[0].change < 0) ? (<div style={{color: '#C90202'}}>{data[0].change}</div>) : (<div style={{color: '#00FF00'}}>{data[0].change}</div>)}</Td>
                            </Tr>
                            ))}
                        </Tbody>
                        </Table>
                    </TableContainer>

                    <RecentGraph/>
                    </div>

                ) : (<p>No entries yet!</p>)}
            </div>
      </div>
    );
  };
  
  export default ForexTable2;