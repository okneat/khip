package web.mono

import java.util.concurrent.atomic.AtomicBoolean
import org.junit.jupiter.api.extension.BeforeAllCallback
import org.junit.jupiter.api.extension.ExtensionContext
import org.testcontainers.containers.GenericContainer

class RedisTestContainerExtension : BeforeAllCallback {
    private val started = AtomicBoolean(false)

    @Throws(Exception::class)
    override fun beforeAll(extensionContext: ExtensionContext) {
        if (!started.get()) {
            val redis = KGenericContainer("redis:6.0.4")
                .withExposedPorts(6379)
            redis.start()
            System.setProperty("redis.test.server", "redis://" + redis.getContainerIpAddress() + ":" + redis.getMappedPort(6379))
            started.set(true)
        }
    }

    // Workaround for Testcointainers issue https://github.com/testcontainers/testcontainers-java/issues/318#issuecomment-290692749
    class KGenericContainer(imageName: String) : GenericContainer<KGenericContainer>(imageName)
}
