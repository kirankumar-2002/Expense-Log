package com.expenselogpro.app.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Outstanding(
    @SerialName("id") val id: Long? = null,
    @SerialName("date") val date: String,
    @SerialName("amount") val amount: Double,
    @SerialName("state") val state: String, // Payable, Receivable
    @SerialName("category") val category: String,
    @SerialName("sub_category") val subCategory: String,
    @SerialName("status") val status: String, // Pending, Processed
    @SerialName("accounts") val accounts: String,
    @SerialName("description") val description: String,
    @SerialName("notes") val notes: String? = null,
    @SerialName("user_id_no") val userIdNo: String? = null, // Used for internal sorting, hidden from UI
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null
)
