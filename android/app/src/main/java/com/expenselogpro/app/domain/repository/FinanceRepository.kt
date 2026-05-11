package com.expenselogpro.app.domain.repository

import com.expenselogpro.app.domain.model.BankAccount
import com.expenselogpro.app.domain.model.CreditCard
import com.expenselogpro.app.domain.model.Outstanding
import com.expenselogpro.app.domain.model.Transaction
import kotlinx.coroutines.flow.Flow

interface FinanceRepository {
    // Transactions
    fun getTransactions(): Flow<List<Transaction>>
    suspend fun addTransaction(transaction: Transaction)
    suspend fun updateTransaction(transaction: Transaction)
    suspend fun deleteTransaction(id: Long)

    // Bank Accounts
    fun getBankAccounts(): Flow<List<BankAccount>>
    suspend fun addBankAccount(account: BankAccount)
    
    // Credit Cards
    fun getCreditCards(): Flow<List<CreditCard>>
    
    // Outstanding
    fun getOutstanding(): Flow<List<Outstanding>>

    // Sync
    suspend fun syncWithRemote()
    suspend fun clearLocalData() // For logout/new user logic
}
