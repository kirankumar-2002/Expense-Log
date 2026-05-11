package com.expenselogpro.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey val id: Long,
    val date: String,
    val amount: Double,
    val state: String,
    val category: String,
    val subCategory: String,
    val status: String,
    val accounts: String,
    val description: String,
    val notes: String?,
    val userIdNo: String?,
    val createdAt: String?,
    val updatedAt: String?,
    val deletedAt: String? = null
)

@Entity(tableName = "bank_accounts")
data class BankAccountEntity(
    @PrimaryKey val id: Long,
    val name: String,
    val bank: String,
    val type: String,
    val balance: Double,
    val standardBalance: Double?,
    val month: String?,
    val userIdNo: String?,
    val lastUpdated: String?,
    val createdAt: String?,
    val deletedAt: String? = null
)

@Entity(tableName = "credit_cards")
data class CreditCardEntity(
    @PrimaryKey val id: Long,
    val name: String,
    val bank: String,
    val balance: Double,
    val cardLimit: Double,
    val userIdNo: String?,
    val createdAt: String?,
    val deletedAt: String? = null
)

@Entity(tableName = "outstanding")
data class OutstandingEntity(
    @PrimaryKey val id: Long,
    val date: String,
    val amount: Double,
    val state: String,
    val category: String,
    val subCategory: String,
    val status: String,
    val accounts: String,
    val description: String,
    val notes: String?,
    val userIdNo: String?,
    val createdAt: String?,
    val updatedAt: String?,
    val deletedAt: String? = null
)

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true) val queueId: Long = 0,
    val tableName: String,
    val operation: String, // INSERT, UPDATE, DELETE
    val payloadJson: String,
    val recordId: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
