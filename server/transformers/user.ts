export const userTransformer = (user: any) => {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization_name: user.organization_name,
        organization_INN: user.organization_INN,
        company_type: user.company_type,
        canDeleterDocuments: user.canDeleterDocuments,
        isActive: user.isActive,
        createdAt: user.createdAt,

    }
}
