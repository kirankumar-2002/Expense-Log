package com.expenselogpro.app.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BankAccount(
    @SerialName("id") val id: Long? = null,
    @SerialName("name") val name: String,
    @SerialName("bank") val bank: String,
    @SerialName("type") val type: String, // Current, Savings
    @SerialName("balance") val balance: Double,
    @SerialName("standard_balance") val standardBalance: Double? = 0.0,
    @SerialName("month") val month: String? = null,
    @SerialName("user_id_no") val userIdNo: String? = null, // Used for internal sorting, hidden from UI
    @SerialName("last_updated") val lastUpdated: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)
