import { PrismaClient } from "@prisma/client";
        import { defineEventHandler, readBody } from "h3";

        const prisma = new PrismaClient();

        export default defineEventHandler(async (event) => {
          const body = await readBody(event);

          const { type, quantity, documetnsQuantity, moderators, contragent, authorId, documentsId } = body;

          if (!type || !quantity || !documetnsQuantity || !moderators || !contragent || !authorId || !documentsId) {
            event.res.statusCode = 400;
            return {
              code: 400,
              body: {
                error: "Необходимо указать все поля"
              }
            };
          }

          try {
            const lead = await prisma.lead.create({
              data: {
                type,
                quantity,
                documetnsQuantity,
                moderators,
                contragent,
                author: { connect: { id: authorId } },
                documents: { connect: { id: documentsId } }
              },
            });

            return {
              status: 201,
              body: { lead },
            };
          } catch (error) {
            console.error("Error creating lead:", error);
            event.res.statusCode = 500;
            return {
              code: 500,
              body: { error: "Ошибка при создании лида " + error }
            };
          }
        });