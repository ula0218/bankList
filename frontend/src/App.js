import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [banks, setBanks] = useState([]);
  // eslint-disable-next-line
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [bankBranches, setBankBranches] = useState([]);

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

  const handleBankCodeSelect = async (bankCode) => {
    setSelectedBankCode(bankCode);
    try {
      const response = await axios.get(`http://localhost:8080/api/banks/${bankCode}/branches`);
      setBankBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  // 從 banks 中篩選唯一的銀行代碼
  const uniqueBankCodes = [...new Set(banks.map(bank => bank.bank_code))];

  return (
    <div>
      <h1>台灣銀行代碼查詢</h1>
      <div className="select-container">
        <div>
          <h2>銀行代碼:</h2>
          <select onChange={(e) => handleBankCodeSelect(e.target.value)}>
            <option value="">選擇銀行代碼</option>
            {uniqueBankCodes.map(bankCode => (
              <option key={bankCode} value={bankCode}>
                {bankCode}
              </option>
            ))}
          </select>
        </div>
        <div>
          <h2>分行名稱:</h2>
          <select>
            <option value="">選擇分行</option>
            {bankBranches.map(branch => (
              <option key={branch.branch_code} value={branch.branch_code}>
                {branch.bank_name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default App;
