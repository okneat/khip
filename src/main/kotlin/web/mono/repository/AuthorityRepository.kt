package web.mono.repository

import org.springframework.data.jpa.repository.JpaRepository
import web.mono.domain.Authority

/**
 * Spring Data JPA repository for the [Authority] entity.
 */

interface AuthorityRepository : JpaRepository<Authority, String>
