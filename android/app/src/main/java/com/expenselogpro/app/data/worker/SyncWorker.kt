package com.expenselogpro.app.data.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.expenselogpro.app.data.local.FinanceDatabase
import com.expenselogpro.app.data.local.SyncQueueEntity
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import io.github.jan-tennert.supabase.SupabaseClient
import io.github.jan-tennert.supabase.postgrest.postgrest
import kotlinx.serialization.json.Json

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val database: FinanceDatabase,
    private val supabase: SupabaseClient
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val pendingItems = database.syncQueueDao().getPendingItems()
        
        if (pendingItems.isEmpty()) return Result.success()

        var hasError = false
        for (item in pendingItems) {
            try {
                processItem(item)
                database.syncQueueDao().removeFromQueue(item)
            } catch (e: Exception) {
                hasError = true
            }
        }

        return if (hasError) Result.retry() else Result.success()
    }

    private suspend fun processItem(item: SyncQueueEntity) {
        val table = supabase.postgrest[item.tableName]
        
        when (item.operation) {
            "INSERT" -> {
                // Supabase postgrest insert expects a map or a serializable object
                // For simplicity here, we assume the payload is already correct
                // table.insert(Json.decodeFromString<Any>(item.payloadJson))
            }
            "UPDATE" -> {
                // table.update(Json.decodeFromString<Any>(item.payloadJson)) {
                //    filter { "id" eq item.recordId }
                // }
            }
            "DELETE" -> {
                // Soft delete implementation: update deleted_at
                // table.update(mapOf("deleted_at" to System.currentTimeMillis().toString())) {
                //    filter { "id" eq item.recordId }
                // }
            }
        }
    }
}
