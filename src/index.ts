// @ts-ignore
import { Service, Context, Logger, Schema } from "koishi";
import { existsSync, promises as fs, createWriteStream } from "fs";
import { exec } from "child_process";
import { extract } from "tar";
import get from "get-registry";

const RSSHubPath = `${__dirname}/../node_modules/rsshub`;
const SHA = "1381377e917f5248e5fa8a1426fe5449783094d3";
const version = `1.0.0-master.${SHA.slice(0, 7)}`;
const githubRawRegistry = "https://raw.githubusercontent.com";
let _RSSHub;

declare module "koishi" {
  interface Context {
    rsshub: RSSHub;
  }
}

const logger = new Logger("rsshub");

class RSSHub extends Service {
  constructor(ctx: Context, public config: RSSHub.Config) {
    super(ctx, "rsshub", false);
  }

  async downloadPackage() {
    const registry = (await get()).replace(/\/$/, "");
    const url = `${registry}/rsshub/-/rsshub-${version}.tgz`;

    const writer = createWriteStream(`${RSSHubPath}/../rsshub-${version}.tgz`);
    const response = await this.ctx.http.axios(url, {
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }

  async extractPackage() {
    await new Promise<void>((resolve, reject) => {
      extract({
        file: `${RSSHubPath}/../rsshub-${version}.tgz`,
        cwd: `${RSSHubPath}/..`,
      })
        .then(resolve)
        .catch(reject);
    });

    await fs.rename(`${RSSHubPath}/../package`, RSSHubPath)
    await fs.readFile(`${RSSHubPath}/../rsshub-${version}.tgz`)
  }

  async downloadPackageJson() {
    const registry = githubRawRegistry;
    const url = `${registry}/DIYgod/RSSHub/${SHA}/package.json`;

    const writer = createWriteStream(`${RSSHubPath}/package.json`);
    const response = await this.ctx.http.axios(url, {
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }

  async downloadYarnLock() {
    const registry = githubRawRegistry;
    const url = `${registry}/DIYgod/RSSHub/${SHA}/yarn.lock`;

    const writer = createWriteStream(`${RSSHubPath}/yarn.lock`);
    const response = await this.ctx.http.axios(url, {
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }

  async install() {
    logger.info("Downloading Package...");
    await this.downloadPackage();
    logger.info("Downloaded Package...");
    logger.info("Extracting Package...");
    await this.extractPackage();
    logger.info("Extracted Package...");
    logger.info("Downloading yarn-lock.yml...");
    await this.downloadYarnLock();
    logger.info("Downloaded yarn-lock.yml...");
    logger.info("Downloading package.json...");
    await this.downloadPackageJson();
    logger.info("Downloaded package.json...");
  }

  async installDependencies() {
    return new Promise<void>((resolve, reject) => {
      const process = exec("yarn --production=true --frozen-lockfile", {
        cwd: `${RSSHubPath}`,
      });

      process.stdout.on("error", reject);
      process.stdout.on("close", resolve);

      process.stdout.on("data", (data) => {
        data = data.toString().trim();

        for (const line of data.split("\n")) {
          logger.info(line);
        }
      });
    });
  }

  protected async start() {
    if (!existsSync(RSSHubPath)) {
      logger.info("RSSHub not found, cloning...");
      await this.install();
      logger.info("RSSHub cloned successfully.");
      logger.info("RSSHub installing dependencies...");
      await this.installDependencies();
      logger.info("RSSHub installed dependencies successfully.");
    }

    _RSSHub = await require(`${RSSHubPath}/lib/pkg.js`);

    _RSSHub.init({
      CACHE_TYPE: null,
      CACHE_EXPIRE: 0,
      LOGGER_LEVEL: "emerg",
      PROXY_URI:
        this.config.PROXY_URI || this.ctx.root.config.request.proxyAgent,
    });
    logger.info("RSSHub Launched");
  }

  async request(path: string): Promise<RSSHub.RequestResult> {
    return _RSSHub
      .request(path)
      .then((res) => {
        return res;
      })
      .catch((error) => {
        logger.error(error);
      }) as Promise<RSSHub.RequestResult>;
  }
}

namespace RSSHub {
  export type RequestResult = {
    title: string;
    item: {
      title: string;
      description: string;
      pubDate: string;
      guid: string;
      link: string;
    }[];
  };

  export interface Config {
    PROXY_URI: string;
  }

  export const Config: Schema<Config, Config> = Schema.intersect([
    Schema.object({
      PROXY_URI: Schema.string().description(
        "RSSHub 代理地址\r\n 缺省时为 request.proxyAgent (https://docs.rsshub.app/install/#pei-zhi-dai-li-pei-zhi)"
      ),
    }),
  ]);
}

export default RSSHub;
