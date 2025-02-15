export const userTransformer = (user: any) => {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        files: user.files,
        role: user.role,
        company: user.company
    }
}