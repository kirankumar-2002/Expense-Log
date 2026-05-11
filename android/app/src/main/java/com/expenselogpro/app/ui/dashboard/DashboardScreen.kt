package com.expenselogpro.app.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.expenselogpro.app.ui.components.GlassCard
import com.expenselogpro.app.ui.components.OutstandingToggle
import com.expenselogpro.app.ui.components.TransactionItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text("Expense Log", style = MaterialTheme.typography.titleLarge)
                        Text("Welcome Back", style = MaterialTheme.typography.labelMedium, color = Color(0xFF64748B))
                    }
                },
                actions = {
                    IconButton(onClick = { }) {
                        Icon(Icons.Default.Notifications, contentDescription = null)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { /* Add New Transaction */ },
                containerColor = Color(0xFF6366F1),
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add")
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0xFFF5F7FF), Color.White)
                    )
                )
                .padding(padding)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Top Section: Balance Summary
                    GlassCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    "TOTAL BALANCE",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Color(0xFF64748B)
                                )
                                Text(
                                    "$${String.format("%.2f", uiState.totalBalance)}",
                                    style = MaterialTheme.typography.headlineLarge,
                                    color = Color(0xFF111827)
                                )
                            }
                            
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    "CREDIT DUE",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Color(0xFFEF4444).copy(alpha = 0.7f)
                                )
                                Text(
                                    "$${String.format("%.2f", uiState.creditOutstanding)}",
                                    style = MaterialTheme.typography.titleLarge,
                                    color = Color(0xFFEF4444)
                                )
                            }
                        }
                    }
                }

                item {
                    // Middle Section: Toggle Tabs
                    Text(
                        "OUTSTANDING",
                        style = MaterialTheme.typography.labelMedium,
                        color = Color(0xFF64748B),
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    OutstandingToggle(
                        selectedState = uiState.outstandingState,
                        onStateSelected = { viewModel.setOutstandingState(it) }
                    )
                }

                item {
                    // Bottom Section: Recent Transactions Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "RECENT TRANSACTIONS",
                            style = MaterialTheme.typography.labelMedium,
                            color = Color(0xFF64748B)
                        )
                        Text(
                            "View All",
                            style = MaterialTheme.typography.labelMedium,
                            color = Color(0xFF6366F1),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                items(uiState.recentTransactions) { transaction ->
                    TransactionItem(
                        category = transaction.category,
                        description = transaction.description,
                        amount = String.format("%.2f", transaction.amount),
                        isExpense = transaction.state == "Payable"
                    )
                }
                
                item {
                    Spacer(modifier = Modifier.height(80.dp)) // FAB space
                }
            }
        }
    }
}
