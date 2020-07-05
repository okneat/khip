package web.mono

import com.tngtech.archunit.core.importer.ClassFileImporter
import com.tngtech.archunit.core.importer.ImportOption
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses
import org.junit.jupiter.api.Test

class ArchTest {

    @Test
    fun servicesAndRepositoriesShouldNotDependOnWebLayer() {

        val importedClasses = ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("web.mono")

        noClasses()
            .that()
                .resideInAnyPackage("web.mono.service..")
            .or()
                .resideInAnyPackage("web.mono.repository..")
            .should().dependOnClassesThat()
                .resideInAnyPackage("..web.mono.web..")
        .because("Services and repositories should not depend on web layer")
        .check(importedClasses)
    }
}
