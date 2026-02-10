export const userTransformer = (user: any) => {
    const organizationName = user.organization?.name || user.organization_name || null;
    const organizationInn = user.organization?.inn || user.organization_INN || null;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization_name: organizationName,
        organization_INN: organizationInn,
        organizationId: user.organizationId ?? user.organization?.id ?? null,
        organization: user.organization ?? (organizationName ? { name: organizationName, inn: organizationInn } : null),
        company_type: user.company_type,
        canDeleterDocuments: user.canDeleterDocuments,
        isActive: user.isActive,
        createdAt: user.createdAt,

    }
}
