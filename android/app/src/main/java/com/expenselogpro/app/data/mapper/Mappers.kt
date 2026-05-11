package com.expenselogpro.app.data.mapper

import com.expenselogpro.app.data.local.BankAccountEntity
import com.expenselogpro.app.data.local.CreditCardEntity
import com.expenselogpro.app.data.local.OutstandingEntity
import com.expenselogpro.app.data.local.TransactionEntity
import com.expenselogpro.app.domain.model.BankAccount
import com.expenselogpro.app.domain.model.CreditCard
import com.expenselogpro.app.domain.model.Outstanding
import com.expenselogpro.app.domain.model.Transaction

fun Transaction.toEntity() = TransactionEntity(
    id = id ?: 0L,
    date = date,
    amount = amount,
    state = state,
    category = category,
    subCategory = subCategory,
    status = status,
    accounts = accounts,
    description = description,
    notes = notes,
    userIdNo = userIdNo,
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun BankAccount.toEntity() = BankAccountEntity(
    id = id ?: 0L,
    name = name,
    bank = bank,
    type = type,
    balance = balance,
    standardBalance = standardBalance,
    month = month,
    userIdNo = userIdNo,
    lastUpdated = lastUpdated,
    createdAt = createdAt
)

fun CreditCard.toEntity() = CreditCardEntity(
    id = id ?: 0L,
    name = name,
    bank = bank,
    balance = balance,
    cardLimit = cardLimit,
    userIdNo = userIdNo,
    createdAt = createdAt
)

fun Outstanding.toEntity() = OutstandingEntity(
    id = id ?: 0L,
    date = date,
    amount = amount,
    state = state,
    category = category,
    subCategory = subCategory,
    status = status,
    accounts = accounts,
    description = description,
    notes = notes,
    userIdNo = userIdNo,
    createdAt = createdAt,
    updatedAt = updatedAt
)
