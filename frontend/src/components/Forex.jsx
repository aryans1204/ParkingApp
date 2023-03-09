import React, { Component, useState, useEffect} from 'react';
import { Navigate } from "react-router-dom";
import NavBar from './NavBar';
import classes from './Forex.module.css';
import { Input, InputGroup, InputLeftElement, Button, ButtonGroup} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import ForexTable from './ForexTable';

class Forex extends Component {
    constructor(props) {
        super(props);
        this.state = { from: "", to: "", authenticated: null, hasData: false};

        this.handleButton = this.handleButton.bind(this);
        this.postData = this.postData.bind(this);
        this.getAllData = this.getAllData.bind(this);
        this.getPair = this.getPair.bind(this);
        //this.getTable = this.getTable.bind(this);
      }

    async componentDidMount() {
        await fetch("/api/users/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        })
          .then((response) => {
            console.log(response.status);
            if (response.status == 401)
                this.setState({ authenticated: false });
            else
                this.setState({ authenticated: true });
          });
          this.getAllData();
    }

    handleButton(event) {
        event.preventDefault();
        let value = this.inputNode.value;
        if (value.length == 0) {
            alert("Empty input");
        }
        else {
            value = value.trim();
            let arr = value.split("/");
            arr = arr.map(element => {
                return element.trim();
            });
            console.log(arr);
            let fromVar = arr[0];
            let toVar = arr[1];
            this.setState({from: fromVar});
            this.setState({to: toVar}, ()=>{this.getPair(fromVar, toVar); this.postData();});
            //TODO: clear text in input
        }
    }

    // Post search to database
    postData() {
        fetch('/api/currencies', {
            method: 'POST',
            body: JSON.stringify({
                currency_from: this.state.from,
                currency_to: this.state.to
            }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionStorage.getItem("token")}`
            }
        })
            .then((response) => response.json())
            .then((data) => {console.log(data);})
            .catch((err) => {
                console.log(err.message);
             });
    }

    // Get pair from API
    getPair(fromVar, toVar, arr) {
        var myHeaders = new Headers();
        myHeaders.append("apikey", import.meta.env.VITE_FIXER_API_KEY);

        var requestOptions = {
            method: 'GET',
            redirect: 'follow',
            headers: myHeaders
        };

        var url = "https://api.apilayer.com/fixer/latest?base=" + fromVar + "&symbols=" + toVar;

        fetch(url, requestOptions)
        .then(response => response.text())
        .then(result => {console.log("PAIR OK"); result = JSON.parse(result); arr.push(result);})
        .catch(error => console.log('error', error));
    }

    // Get recent 5 searches
    getAllData () {
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
                this.setState({hasData: true});
                // Gets recent 5 pairs and puts into conversions array
                var conversions = []
                // DB has <= 5 
                if (data.length <= 5) {
                    data.forEach(element => {
                        let pair ={from: element["currency_from"], to: element["currency_to"]};
                        conversions.push(pair);
                    })
                } else {
                    // DB has > 5
                    let count = 0;
                    data.forEach(element => {
                            if (count != 5) {
                                count += 1;
                                let pair = {from: element["currency_from"], to: element["currency_to"]}
                                conversions.push(pair);
                            }}
                    )
                }
                console.log(conversions);
                console.log("WE ARE HERE");

                // for each conversion, getPair and put into responses array
                var responses = [];
                conversions.forEach((item) => {
                    const from = item.from;
                    const to = item.to;
                    this.getPair(from, to, responses);
                });
                console.log(responses);
                    
                // return (<p>sdgffgdgdfg</p>)
            }
            

            // return (
            //     <Tr>
            //         {responses.map(resp => {
            //             let pair = resp.base + '/' + Object.keys(resp.rates);
            //             return ( <>
            //                 <Td>{pair}</Td>
            //                 <Td>{resp.rates[0]}</Td>
            //                 <Td>Something</Td>
            //                 </>
            //             )
            //         })}
            //     </Tr>
            // )




        })
        .catch((err) => {
            console.log(err.message);
        });
    }

    render() {
        return (
            <>
            {this.state.authenticated == false && (<Navigate to="/" replace={true} />)}
            <NavBar />
            <div className={classes.div}>
                <h1 className={classes.text}>FOREX</h1>
                <div className={classes.search}>
                    <InputGroup>
                    <InputLeftElement
                        pointerEvents='none'
                        children={<SearchIcon color='gray.600' />}
                    />
                    <Input placeholder='Enter Currency Pair' htmlSize={50} width='auto' variant='filled' ref={node => (this.inputNode = node)}/>
                    <Button colorScheme='purple' onClick={this.handleButton}>Search</Button>
                    </InputGroup>
                </div>
                {(this.state.hasData) ? (<ForexTable/>) : (<p>No entries yet!</p>)}


            </div>
            </>
        );
    }
}

export default Forex;