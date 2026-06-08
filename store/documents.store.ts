import { useAdminStore } from "~/store/admin.store";
import type {
	CreateDocumentPayload,
	Document,
	UpdateDocumentPayload,
} from "~/store/user.store";

/**
 * Domain store для документов.
 *
 * **Текущая реализация** — фасад поверх [[useAdminStore]] для гарантии single source of truth.
 * Когда страницы будут смигрированы с прямого `useAdminStore` на этот store,
 * можно будет инвертировать: state переехать сюда, admin.store — удалить.
 *
 * Использование:
 * ```ts
 * const docs = useDocumentsStore();
 * await docs.getAllUnsignedDocuments();
 * docs.unsignedDocuments // reactive Document[]
 * ```
 */
export const useDocumentsStore = defineStore("documents", () => {
	const admin = useAdminStore();

	// ─── State (read-only computed proxies) ─────────────────────────────────

	const documents = computed<Document[]>(() => admin.documents);
	const unsignedDocuments = computed<Document[]>(() => admin.unsignedDocuments);
	const signedDocuments = computed<Document[]>(() => admin.signedDocuments);
	const trashDocuments = computed<Document[]>(() => admin.trashDocuments);
	const filteredDocuments = computed<Document[]>(() => admin.filteredDocuments);

	// ─── Getters ────────────────────────────────────────────────────────────

	const getDocumentById = (id: number): Document | undefined => admin.getDocumentById(id);

	// ─── Actions (delegated to admin.store) ─────────────────────────────────

	const createDocument = (payload: CreateDocumentPayload, file: File) =>
		admin.createDocument(payload, file);

	const getAllDocuments = () => admin.getAllDocuments();
	const getAllUnsignedDocuments = () => admin.getAllUnsignedDocuments();
	const getUnsignedDocumentsByUserId = (userId: number) =>
		admin.getUnsignedDocumentsByUserId(userId);
	const getAllSignedDocuments = () => admin.getAllSignedDocuments();
	const getSignedDocumentsByUserId = (userId: number) =>
		admin.getSignedDocumentsByUserId(userId);
	const getTrashDocuments = () => admin.getTrashDocuments();
	const getTrashDocumentsByUserId = (userId: number) =>
		admin.getTrashDocumentsByUserId(userId);
	const getDocumentsByUserId = (userId: number | string) =>
		admin.getDocumentsByUserId(userId);
	const getDocumentsByLeadId = (leadId: number | string) =>
		admin.getDocumentsByLeadId(leadId);

	const updateDocument = (payload: UpdateDocumentPayload) => admin.updateDocument(payload);
	const updateDocumentModerator = (id: number, moderatorId: number) =>
		admin.updateDocumentModerator(id, moderatorId);
	const restoreDocument = (userId: number, documentId: number) =>
		admin.restoreDocument(userId, documentId);
	const deleteDocument = (userId: number, id: number) => admin.deleteDocument(userId, id);

	const createSign = (
		documentId: number,
		userId: number,
		signature: File,
		finalPdfFile: File,
		certInfo: Record<string, unknown> | undefined,
		stampData: Record<string, unknown>,
	) => admin.createSign(documentId, userId, signature, finalPdfFile, certInfo, stampData);

	const deleteSignature = (signId: number) => admin.deleteSignature(signId);

	return {
		documents,
		unsignedDocuments,
		signedDocuments,
		trashDocuments,
		filteredDocuments,
		getDocumentById,
		createDocument,
		getAllDocuments,
		getAllUnsignedDocuments,
		getUnsignedDocumentsByUserId,
		getAllSignedDocuments,
		getSignedDocumentsByUserId,
		getTrashDocuments,
		getTrashDocumentsByUserId,
		getDocumentsByUserId,
		getDocumentsByLeadId,
		updateDocument,
		updateDocumentModerator,
		restoreDocument,
		deleteDocument,
		createSign,
		deleteSignature,
	};
});
