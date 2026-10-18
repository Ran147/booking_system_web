/**
 * @file Contrato de interfaz JSDoc para el módulo de servicios del negocio.
 */

/**
 * @typedef {Object} ServiceListItem
 * @property {string} [description] - Descripción opcional del servicio.
 * @property {number} durationMinutes - Duración en minutos del servicio.
 * @property {string} id - Identificador único de Firestore.
 * @property {string} name - Nombre del servicio.
 * @property {number} priceInCents - Precio en centavos en la moneda del negocio.
 * @property {"active" | "inactive"} status - Estado del servicio en el catálogo.
 */

/**
 * @typedef {Object} ServiceListFilters
 * @property {string} searchTerm - Término de búsqueda por prefijo de nombre.
 * @property {"active" | "inactive" | ""} status - Filtro de estado o vacío para todos.
 */

/**
 * @typedef {Object} ServiceListQueryParams
 * @property {string} businessId - Identificador del negocio tenant.
 * @property {ServiceListFilters} filters - Filtros de búsqueda y estado.
 * @property {import('@/types').Nullable<import('@/types').PageCursor>} pageCursor - Cursor para paginación de Firestore.
 * @property {number} pageSize - Tamaño de la página de resultados.
 */

/**
 * @typedef {Object} ServiceListViewModel
 * @property {string} currency - Código de divisa ISO 4217 del negocio.
 * @property {ServiceListFilters} filters - Filtros activos en la URL.
 * @property {() => void} handleClearFilters - Limpia la búsqueda y los filtros de estado.
 * @property {() => void} handleCreateService - Navega a la creación de un nuevo servicio.
 * @property {() => void} handleNextPage - Avanza a la siguiente página.
 * @property {() => void} handlePreviousPage - Retrocede a la página previa.
 * @property {() => void} handleRetry - Reintenta la consulta en caso de error de red.
 * @property {(searchTerm: string) => void} handleSearchChange - Actualiza el término de búsqueda.
 * @property {(status: string) => void} handleStatusChange - Actualiza el filtro de estado.
 * @property {boolean} hasActiveFilters - Indica si hay filtros o búsquedas aplicadas.
 * @property {boolean} hasNextPage - Indica si existe una siguiente página de resultados.
 * @property {boolean} hasPreviousPage - Indica si existe una página anterior.
 * @property {boolean} isEmpty - Indica si el negocio no tiene servicios registrados.
 * @property {boolean} isNoResults - Indica si los filtros no arrojaron ningún resultado.
 * @property {boolean} isReadOnly - Indica si el negocio está inactivo o suspendido.
 * @property {number} pageNumber - Número de página actual (1-indexed).
 * @property {ServiceListItem[]} services - Lista de servicios de la página actual.
 * @property {number} totalCount - Cantidad total de servicios que coinciden con los filtros.
 * @property {import('@/constants').ViewState} viewState - Estado de la vista (loading, error, empty, ready).
 */

/**
 * @typedef {Object} ServiceDetail
 * @property {string} description - Descripción del servicio.
 * @property {number} durationMinutes - Duración en minutos del servicio.
 * @property {readonly string[]} features - Características adicionales.
 * @property {string} id - Identificador único de Firestore.
 * @property {import('@/types').Nullable<string>} imageUrl - URL de imagen del servicio.
 * @property {string} name - Nombre del servicio.
 * @property {number} priceInCents - Precio en centavos en la moneda del negocio.
 * @property {"active" | "inactive"} status - Estado del servicio en el catálogo.
 */

/**
 * @typedef {Object} UpdateServicePayload
 * @property {string} businessId - Identificador del negocio tenant.
 * @property {import('./ServiceForm.schema').ServiceFormValues} formValues - Valores del formulario de edición.
 * @property {string} serviceId - Identificador único del servicio.
 */

export {};
