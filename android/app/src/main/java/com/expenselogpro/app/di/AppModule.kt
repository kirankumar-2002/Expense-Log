import android.content.Context
import androidx.room.Room
import com.expenselogpro.app.data.local.FinanceDatabase
import com.expenselogpro.app.data.remote.SupabaseClientFactory
import com.expenselogpro.app.data.repository.FinanceRepositoryImpl
import com.expenselogpro.app.domain.repository.FinanceRepository
import com.google.firebase.auth.FirebaseAuth
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.github.jan-tennert.supabase.SupabaseClient
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    @Singleton
    abstract fun bindFinanceRepository(impl: FinanceRepositoryImpl): FinanceRepository
}

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideFirebaseAuth(): FirebaseAuth = FirebaseAuth.getInstance()

    @Provides
    @Singleton
    fun provideFinanceDatabase(@ApplicationContext context: Context): FinanceDatabase {
        return Room.databaseBuilder(
            context,
            FinanceDatabase::class.java,
            "finance_db"
        ).build()
    }

    @Provides
    @Singleton
    fun provideSupabaseClient(
        factory: SupabaseClientFactory
    ): SupabaseClient {
        // These should ideally be in BuildConfig or a local.properties file
        return factory.create(
            supabaseUrl = "https://udpbbkcrvebyghgaqqgo.supabase.co", // From existing web app
            supabaseKey = "sb_publishable_DUSdBZceaN1fyHYcKztjPg_Db5CYNPm" // From existing web app
        )
    }
}
