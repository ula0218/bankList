import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, Link, useParams, useNavigate } from 'react-router-dom';
import './App.css';

function Home() {
  const [banks, setBanks] = useState([]);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [bankBranches, setBankBranches] = useState([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState('');
  const [selectedBranchInfo, setSelectedBranchInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { bankCode: paramBankCode, branchCode: paramBranchCode } = useParams();

  useEffect(() => {
    fetchBanks();
    if (paramBankCode) {
      setSelectedBankCode(paramBankCode);
      if (paramBranchCode) {
        setSelectedBranchCode(paramBranchCode);
        fetchSelectedBranchInfo(paramBankCode, paramBranchCode);
      }
    }
  }, [paramBankCode, paramBranchCode]);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/banks');
      setBanks(response.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankBranches = async (bankCode) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/banks/${bankCode}/branches`);
      setBankBranches(response.data);
      setSelectedBranchCode(''); // 清空選擇的分行代碼
      setSelectedBranchInfo(null); // 清空選擇的分行詳細資訊
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedBranchInfo = async (bankCode, branchCode) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/banks/${bankCode}/branches/${branchCode}`);
      setSelectedBranchInfo(response.data);
    } catch (error) {
      console.error('Error fetching selected branch info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBankCodeSelect = async (bankCode) => {
    setSelectedBankCode(bankCode);
    fetchBankBranches(bankCode);
  };

  const handleBranchSelect = async (branchCode) => {
    setSelectedBranchCode(branchCode);
    const selectedBranch = bankBranches.find(branch => branch.branch_code === branchCode);
    setSelectedBranchInfo(selectedBranch || null);
    if (selectedBankCode && branchCode) {
      navigate(`/banks/${selectedBankCode}/${branchCode}`);
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

  const clearSelection = () => {
    setSelectedBankCode('');
    setSelectedBranchCode('');
    setSelectedBranchInfo(null);
    navigate('/');
  };

  const copyBranchURL = () => {
    if (selectedBranchInfo) {
      const branchURL = `${window.location.origin}/banks/${selectedBankCode}/${selectedBranchCode}`;
      navigator.clipboard.writeText(branchURL)
        .then(() => {
          alert(`已複製分行網址 ${branchURL} 到剪貼板！`);
        })
        .catch(err => {
          console.error('Error copying branch URL:', err);
          alert('複製分行網址失敗，請手動複製。');
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
          <select onChange={(e) => handleBranchSelect(e.target.value)} value={selectedBranchCode}>
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
            <a href="https://data.gov.tw/dataset/6041" target="_blank" rel="noopener noreferrer">政府資料公開平台</a>
          </div>
          <button onClick={clearSelection}>清除查詢</button>
          <button onClick={copyBranchURL}>複製分行網址</button>
        </div>
      )}
      {loading && <p>Loading...</p>}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/banks/:bankCode/:branchCode" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
