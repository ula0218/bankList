// src/BankList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BankList = () => {
    const [banks, setBanks] = useState([]);

    useEffect(() => {
        fetchBanks();
    }, []);

    const fetchBanks = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/banks');
            setBanks(response.data);
        } catch (error) {
            console.error('Error fetching banks:', error);
        }
    };

    return (
        <div>
            <h2>Bank List</h2>
            <ul>
                {banks.map(bank => (
                    <li key={bank.BankCode}>
                        <p>Bank Code: {bank.BankCode}</p>
                        <p>Bank Name: {bank.BankName}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default BankList;
