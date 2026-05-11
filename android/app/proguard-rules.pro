# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.kts.

# Keep Kotlin Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep @Serializable classes
-keep,includedescriptorclasses class com.expenselogpro.app.domain.model.**$$serializer { *; }
-keepclassmembers class com.expenselogpro.app.domain.model.** {
    *** Companion;
}
-keepclasseswithmembers class com.expenselogpro.app.domain.model.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Supabase / Ktor
-dontwarn io.ktor.**
-keep class io.ktor.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
