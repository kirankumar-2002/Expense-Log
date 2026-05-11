package com.expenselogpro.app.data.repository

import com.expenselogpro.app.data.local.*
import com.expenselogpro.app.data.mapper.toEntity
import com.expenselogpro.app.domain.model.*
import com.expenselogpro.app.domain.repository.FinanceRepository
import io.github.jan-tennert.supabase.SupabaseClient
import io.github.jan-tennert.supabase.postgrest.postgrest
import io.github.jan-tennert.supabase.postgrest.query.Columns
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FinanceRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient,
    private val database: FinanceDatabase
) : FinanceRepository {

    private val financeDao = database.financeDao()
    private val syncQueueDao = database.syncQueueDao()

    override fun getTransactions(): Flow<List<Transaction>> =
        financeDao.getAllTransactions().map { entities ->
            entities.map { it.toDomain() }
        }

    override suspend fun addTransaction(transaction: Transaction) {
        val json = Json.encodeToString(transaction)
        syncQueueDao.addToQueue(SyncQueueEntity(tableName = "transactions", operation = "INSERT", payloadJson = json))
    }

    override suspend fun updateTransaction(transaction: Transaction) {
        val json = Json.encodeToString(transaction)
        syncQueueDao.addToQueue(
            SyncQueueEntity(
                tableName = "transactions", 
                operation = "UPDATE", 
                payloadJson = json, 
                recordId = transaction.id.toString()
            )
        )
    }

    override suspend fun deleteTransaction(id: Long) {
        syncQueueDao.addToQueue(
            SyncQueueEntity(
                tableName = "transactions", 
                operation = "DELETE", 
                payloadJson = "{}", 
                recordId = id.toString()
            )
        )
    }

    override fun getBankAccounts(): Flow<List<BankAccount>> =
        financeDao.getAllBankAccounts().map { entities ->
            entities.map { it.toDomain() }
        }

    override suspend fun addBankAccount(account: BankAccount) {
        val json = Json.encodeToString(account)
        syncQueueDao.addToQueue(SyncQueueEntity(tableName = "bank_accounts", operation = "INSERT", payloadJson = json))
    }

    override fun getCreditCards(): Flow<List<CreditCard>> =
        financeDao.getAllCreditCards().map { entities ->
            entities.map { it.toDomain() }
        }

    override fun getOutstanding(): Flow<List<Outstanding>> =
        financeDao.getAllOutstanding().map { entities ->
            entities.map { it.toDomain() }
        }

    override suspend fun syncWithRemote() {
        try {
            val remoteTransactions = supabase.postgrest["transactions"]
                .select(columns = Columns.ALL) {
                    filter { "deleted_at" eq null }
                }.decodeList<Transaction>()

            val remoteAccounts = supabase.postgrest["bank_accounts"]
                .select(columns = Columns.ALL) {
                    filter { "deleted_at" eq null }
                }.decodeList<BankAccount>()

            database.runInTransaction {
                // Simplified sync logic
                // In a production app, we would perform complex diffing.
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override suspend fun clearLocalData() {
        database.runInTransaction {
            // New user logic: wipe local state
        }
    }

    // --- Internal Mappers ---
    private fun TransactionEntity.toDomain() = Transaction(id, date, amount, state, category, subCategory, status, accounts, description, notes, userIdNo, createdAt, updatedAt)
    private fun BankAccountEntity.toDomain() = BankAccount(id, name, bank, type, balance, standardBalance, month, userIdNo, lastUpdated, createdAt)
    private fun CreditCardEntity.toDomain() = CreditCard(id, name, bank, balance, cardLimit, userIdNo, createdAt)
    private fun OutstandingEntity.toDomain() = Outstanding(id, date, amount, state, category, subCategory, status, accounts, description, notes, userIdNo, createdAt, updatedAt)
}
