import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function extractP7sInfo(filePath: string) {
	try {
		const { stdout } = await execAsync(`bash server/utils/extractP7sInfo.sh "${filePath}"`);

		return stdout;
	} catch (e) {
		console.error("❌ OpenSSL parsing failed:", e);
		return null;
	}
}
