export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  console.log('OAuth callback query:', query)
  return { message: 'Callback ok', query }
})
