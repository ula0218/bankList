package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

type Bank struct {
	BankCode   string `json:"bank_code"`
	BranchCode string `json:"branch_code"`
	BankName   string `json:"bank_name"`
}

type Branch struct {
	BranchCode string `json:"branch_code"`
	BankName   string `json:"bank_name"`
	Phone      string `json:"phone"`
	Address    string `json:"address"`
}

var db *sql.DB

func main() {
	// 載入環境變數
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// 初始化資料庫連線
	initDB()
	defer db.Close()

	// 創建路由
	r := chi.NewRouter()

	// 創建 CORS 設定
	cors := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000"}, // 允許的前端源
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, // 允許的 HTTP 方法
		AllowedHeaders: []string{"*"}, // 允許的 HTTP 標頭
		Debug:          true,          // 調試模式，可選
	})

	// 設置 API 端點 "/api/banks" 的處理函式
	r.Get("/api/banks", getBanksHandler)

	// 設置 API 端點 "/api/banks/{bank_code}/branches" 的處理函式
	r.Get("/api/banks/{bank_code}/branches", getBankBranchesHandler)

	// 設置 CORS 中介軟件
	handler := cors.Handler(r)

	// 啟動服務並監聽 8080 端口
	log.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func initDB() {
	// 從環境變數中取得資料庫連線設定
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASS")
	dbName := os.Getenv("DB_NAME")

	// 構造資料庫連線字串
	dataSourceName := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", dbUser, dbPass, dbHost, dbPort, dbName)

	// 建立資料庫連線
	var err error
	db, err = sql.Open("mysql", dataSourceName)
	if err != nil {
		log.Fatalf("Error opening database connection: %v", err)
	}
	fmt.Println("DB連線成功")

	// 測試資料庫連線
	err = db.Ping()
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	fmt.Println("DB連線成功")
}

func getBanksHandler(w http.ResponseWriter, r *http.Request) {
	banks, err := queryBanks()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error querying banks: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(banks)
}

func queryBanks() ([]Bank, error) {
	// 執行 SQL 查詢，選取 bank_code、branch_code 和 bank_name 欄位
	rows, err := db.Query("SELECT bank_code, branch_code, bank_name FROM banks")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// 建立用於儲存銀行資訊的空切片
	var banks []Bank

	// 迭代處理查詢結果的每一行
	for rows.Next() {
		// 暫存每一行資料庫查詢得到的結果
		var bank Bank
		err := rows.Scan(&bank.BankCode, &bank.BranchCode, &bank.BankName)
		if err != nil {
			return nil, err
		}
		banks = append(banks, bank)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return banks, nil
}

func getBankBranchesHandler(w http.ResponseWriter, r *http.Request) {
	// 從 URL 參數中獲取 bank_code
	bankCode := chi.URLParam(r, "bank_code")

	branches, err := queryBranches(bankCode)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error querying branches: %v", err), http.StatusInternalServerError)
		log.Printf("Error querying branches for bank_code %s: %v", bankCode, err)
		return
	}

	if branches == nil {
		http.Error(w, fmt.Sprintf("No branches found for bank_code %s", bankCode), http.StatusNotFound)
		log.Printf("No branches found for bank_code %s", bankCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(branches)
}

func queryBranches(bankCode string) ([]Branch, error) {
	// 執行 SQL 查詢，選取符合 bank_code 的分行資料，包括分行名稱、電話和地址
	query := "SELECT branch_code, bank_name, phone, address FROM banks WHERE bank_code = ?"
	rows, err := db.Query(query, bankCode)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// 建立用於儲存分行資訊的空切片
	var branches []Branch

	// 迭代處理查詢結果的每一行
	for rows.Next() {
		// 暫存每一行資料庫查詢得到的結果
		var branch Branch
		err := rows.Scan(&branch.BranchCode, &branch.BankName, &branch.Phone, &branch.Address)
		if err != nil {
			return nil, err
		}
		branches = append(branches, branch)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return branches, nil
}
