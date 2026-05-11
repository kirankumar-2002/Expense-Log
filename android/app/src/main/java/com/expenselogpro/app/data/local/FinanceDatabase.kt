package com.expenselogpro.app.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface FinanceDao {
    @Query("SELECT * FROM transactions WHERE deletedAt IS NULL ORDER BY date DESC")
    fun getAllTransactions(): Flow<List<TransactionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransactions(transactions: List<TransactionEntity>)

    @Query("SELECT * FROM bank_accounts WHERE deletedAt IS NULL")
    fun getAllBankAccounts(): Flow<List<BankAccountEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBankAccounts(accounts: List<BankAccountEntity>)

    @Query("SELECT * FROM credit_cards WHERE deletedAt IS NULL")
    fun getAllCreditCards(): Flow<List<CreditCardEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCreditCards(cards: List<CreditCardEntity>)

    @Query("SELECT * FROM outstanding WHERE deletedAt IS NULL ORDER BY date DESC")
    fun getAllOutstanding(): Flow<List<OutstandingEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOutstanding(outstanding: List<OutstandingEntity>)

    @Query("DELETE FROM transactions")
    suspend fun clearAllTransactions()

    @Query("DELETE FROM bank_accounts")
    suspend fun clearAllBankAccounts()

    @Query("DELETE FROM credit_cards")
    suspend fun clearAllCreditCards()

    @Query("DELETE FROM outstanding")
    suspend fun clearAllOutstanding()
}

@Dao
interface SyncQueueDao {
    @Insert
    suspend fun addToQueue(item: SyncQueueEntity)

    @Query("SELECT * FROM sync_queue ORDER BY createdAt ASC")
    suspend fun getPendingItems(): List<SyncQueueEntity>

    @Delete
    suspend fun removeFromQueue(item: SyncQueueEntity)
}

@Database(
    entities = [
        TransactionEntity::class,
        BankAccountEntity::class,
        CreditCardEntity::class,
        OutstandingEntity::class,
        SyncQueueEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class FinanceDatabase : RoomDatabase() {
    abstract fun financeDao(): FinanceDao
    abstract fun syncQueueDao(): SyncQueueDao
}
