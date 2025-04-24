import serveStatic from 'serve-static'
import { fromNodeMiddleware } from 'h3'
import { join } from 'path'

export default fromNodeMiddleware(
  serveStatic(join(process.cwd(), 'public'), {
    index: false,
  })
)
