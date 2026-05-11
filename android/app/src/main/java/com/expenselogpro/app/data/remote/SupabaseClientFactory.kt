package com.expenselogpro.app.data.remote

import com.google.firebase.auth.FirebaseAuth
import io.github.jan-tennert.supabase.SupabaseClient
import io.github.jan-tennert.supabase.createSupabaseClient
import io.github.jan-tennert.supabase.postgrest.Postgrest
import io.ktor.client.plugins.auth.Auth
import io.ktor.client.plugins.auth.providers.BearerTokens
import io.ktor.client.plugins.auth.providers.bearer
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Factory class to initialize SupabaseClient with a dynamic Firebase Identity Bridge.
 */
@Singleton
class SupabaseClientFactory @Inject constructor(
    private val firebaseAuth: FirebaseAuth
) {
    fun create(supabaseUrl: String, supabaseKey: String): SupabaseClient {
        return createSupabaseClient(supabaseUrl, supabaseKey) {
            install(Postgrest)

            httpConfig {
                install(Auth) {
                    bearer {
                        loadTokens {
                            val token = firebaseAuth.currentUser?.getIdToken(false)?.await()?.token
                            token?.let { BearerTokens(it, "") }
                        }
                        refreshTokens {
                            // Force refresh Firebase token
                            val token = firebaseAuth.currentUser?.getIdToken(true)?.await()?.token
                            token?.let { BearerTokens(it, "") }
                        }
                        sendWithoutRequest { request ->
                            // Always send for Supabase REST requests
                            request.url.host.contains("supabase.co")
                        }
                    }
                }
            }
        }
    }
}
