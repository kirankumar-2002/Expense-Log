package com.expenselogpro.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Accent = Color(0xFF6366F1)
val AccentHover = Color(0xFF4F46E5)
val AccentLight = Color(0xFFE0E7FF)
val Income = Color(0xFF10B981)
val Expense = Color(0xFFEF4444)
val Bills = Color(0xFFF59E0B)
val Credit = Color(0xFF3B82F6)

val LightBg = Color(0xFFF8FAFC)
val DarkBg = Color(0xFF0F172A)
val Surface = Color(0xFFF1F5F9)
val Text = Color(0xFF111827)

private val LightColorScheme = lightColorScheme(
    primary = Accent,
    onPrimary = Color.White,
    secondary = Credit,
    onSecondary = Color.White,
    tertiary = Income,
    background = LightBg,
    surface = Color.White,
    onSurface = Text,
    outline = Color(0xFFE2E8F0)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF818CF8),
    onPrimary = Color.White,
    secondary = Color(0xFF60A5FA),
    background = DarkBg,
    surface = Color(0xFF1E293B),
    onSurface = Color(0xFFF8FAFC)
)

@Composable
fun ExpenseLogTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
