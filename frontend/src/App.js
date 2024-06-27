import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [banks, setBanks] = useState([]);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [bankBranches, setBankBranches] = useState([]);
  const [selectedBranchInfo, setSelectedBranchInfo] = useState(null);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/banks');
      setBanks(response.data);
      setSelectedBankCode(''); // 清空選擇的銀行代碼
      setBankBranches([]);    // 清空分行列表
      setSelectedBranchInfo(null); // 清空選擇的分行詳細資訊
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const handleBankCodeSelect = async (bankCode) => {
    setSelectedBankCode(bankCode);
    try {
      const response = await axios.get(`http://localhost:8080/api/banks/${bankCode}/branches`);
      setBankBranches(response.data);
      setSelectedBranchInfo(null); // 清空選擇的分行詳細資訊
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleBranchSelect = async (branchCode) => {
    const selectedBranch = bankBranches.find(branch => branch.branch_code === branchCode);
    if (selectedBranch) {
      setSelectedBranchInfo(selectedBranch);
    } else {
      setSelectedBranchInfo(null);
    }
  };

  const copyBranchCode = () => {
    if (selectedBranchInfo) {
      navigator.clipboard.writeText(selectedBranchInfo.branch_code)
        .then(() => {
          alert(`已複製分行代碼 ${selectedBranchInfo.branch_code} 到剪貼板！`);
        })
        .catch(err => {
          console.error('Error copying branch code:', err);
          alert('複製分行代碼失敗，請手動複製。');
        });
    }
  };

  const uniqueBankCodes = [...new Set(banks.map(bank => bank.bank_code))];

  return (
    <div>
      <h1>台灣銀行代碼查詢</h1>
      <div className="select-container">
        <div>
          <h2>銀行代碼:</h2>
          <select onChange={(e) => handleBankCodeSelect(e.target.value)} value={selectedBankCode}>
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
          <select onChange={(e) => handleBranchSelect(e.target.value)} value={selectedBranchInfo ? selectedBranchInfo.branch_code : ''}>
            <option value="">選擇分行</option>
            {bankBranches.map(branch => (
              <option key={branch.branch_code} value={branch.branch_code}>
                {branch.bank_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {selectedBranchInfo && (
        <div className="branch-details">
          <h2>分行詳細資訊</h2>
          <p><strong>分行名稱:</strong> {selectedBranchInfo.bank_name}</p>
          <p><strong>分行代碼:</strong> {selectedBranchInfo.branch_code} <button onClick={copyBranchCode}>複製</button></p>
          <p><strong>分行電話:</strong> {selectedBranchInfo.phone}</p>
          <p><strong>分行地址:</strong> {selectedBranchInfo.address}</p>
          <div>
            <button onClick={fetchBanks}>重新查詢清空</button>
          </div>
        </div>
        
      )}
    </div>
  );
}

export default App;

