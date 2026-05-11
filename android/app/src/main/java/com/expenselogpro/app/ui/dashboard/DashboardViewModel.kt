package com.expenselogpro.app.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.expenselogpro.app.domain.model.Transaction
import com.expenselogpro.app.domain.repository.FinanceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val totalBalance: Double = 0.0,
    val creditOutstanding: Double = 0.0,
    val recentTransactions: List<Transaction> = emptyList(),
    val outstandingState: String = "Payable",
    val isLoading: Boolean = false
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: FinanceRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboardData()
    }

    private fun loadDashboardData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            // Combine flows for real-time updates
            combine(
                repository.getTransactions(),
                repository.getBankAccounts(),
                repository.getCreditCards()
            ) { transactions, accounts, cards ->
                val balance = accounts.sumOf { it.balance }
                val outstanding = cards.sumOf { it.balance }
                
                // Sort by created_at DESC as requested
                val sortedTransactions = transactions.sortedByDescending { it.createdAt }
                
                DashboardUiState(
                    totalBalance = balance,
                    creditOutstanding = outstanding,
                    recentTransactions = sortedTransactions.take(10),
                    isLoading = false
                )
            }.collect { newState ->
                _uiState.value = newState
            }
        }
    }

    fun setOutstandingState(state: String) {
        _uiState.update { it.copy(outstandingState = state) }
    }
}
