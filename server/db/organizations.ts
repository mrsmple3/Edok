import { prisma } from "~/server/db/index";

export const getOrganizations = () => {
	return prisma.organization.findMany({
		orderBy: { createdAt: "desc" },
	});
};

export const getOrganizationById = (id: number) => {
	return prisma.organization.findUnique({
		where: { id },
	});
};

export const getOrganizationByInn = (inn?: string | null) => {
	if (!inn) {
		return null;
	}

	return prisma.organization.findUnique({
		where: { inn },
	});
};

export const getOrganizationByName = (name?: string | null) => {
	if (!name) {
		return null;
	}

	return prisma.organization.findFirst({
		where: { name },
	});
};

export const createOrganization = (data: { name: string; inn?: string | null }) => {
	return prisma.organization.create({
		data: {
			name: data.name,
			inn: data.inn || null,
		},
	});
};

export const deleteOrganization = async (id: number) => {
	return prisma.$transaction(async (tx) => {
		await tx.lead.updateMany({
			where: { organizationId: id },
			data: { organizationId: null },
		});

		await tx.user.updateMany({
			where: { organizationId: id },
			data: { organizationId: null },
		});

		return tx.organization.delete({
			where: { id },
		});
	});
};

export const findOrCreateOrganization = async (data: { name?: string | null; inn?: string | null }) => {
	const inn = data.inn?.trim() || null;
	const name = data.name?.trim() || null;

	if (!inn && !name) {
		return null;
	}

	if (inn) {
		const existingByInn = await getOrganizationByInn(inn);
		if (existingByInn) {
			return existingByInn;
		}
	}

	if (name) {
		const existingByName = await getOrganizationByName(name);
		if (existingByName) {
			return existingByName;
		}
	}

	if (!name) {
		return null;
	}

	return createOrganization({ name, inn });
};
