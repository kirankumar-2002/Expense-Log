package com.expenselogpro.app.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class CreditCard(
    @SerialName("id") val id: Long? = null,
    @SerialName("name") val name: String,
    @SerialName("bank") val bank: String,
    @SerialName("balance") val balance: Double,
    @SerialName("card_limit") val cardLimit: Double,
    @SerialName("user_id_no") val userIdNo: String? = null, // Used for internal sorting, hidden from UI
    @SerialName("created_at") val createdAt: String? = null
)
