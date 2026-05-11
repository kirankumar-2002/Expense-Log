package com.expenselogpro.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(
                Brush.linearGradient(
                    listOf(
                        Color.White.copy(alpha = 0.6f),
                        Color.White.copy(alpha = 0.2f)
                    )
                )
            )
            .border(
                1.dp,
                Brush.linearGradient(
                    listOf(
                        Color.White.copy(alpha = 0.5f),
                        Color.White.copy(alpha = 0.1f)
                    )
                ),
                RoundedCornerShape(24.dp)
            )
            .padding(20.dp)
    ) {
        Column { content() }
    }
}

@Composable
fun OutstandingToggle(
    selectedState: String,
    onStateSelected: (String) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFFF1F5F9))
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        listOf("Payable", "Receivable").forEach { state ->
            val isSelected = selectedState == state
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (isSelected) Color.White else Color.Transparent)
                    .clickable { onStateSelected(state) }
                    .then(if (isSelected) Modifier.border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp)) else Modifier),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = state,
                    style = MaterialTheme.typography.labelMedium,
                    color = if (isSelected) Color(0xFF6366F1) else Color(0xFF64748B),
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun TransactionItem(
    category: String,
    description: String,
    amount: String,
    isExpense: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp, horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(if (isExpense) Color(0xFFFEF2F2) else Color(0xFFECFDF5)),
            contentAlignment = Alignment.Center
        ) {
            // Icon would go here
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = category,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF111827)
            )
            Text(
                text = description,
                style = MaterialTheme.typography.labelMedium,
                color = Color(0xFF64748B)
            )
        }
        
        Text(
            text = "${if (isExpense) "-" else "+"} $amount",
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.ExtraBold,
            color = if (isExpense) Color(0xFFEF4444) else Color(0xFF10B981)
        )
    }
}
