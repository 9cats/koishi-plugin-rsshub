// @ts-ignore
import _RSSHub from "../rsshub/node_modules/rsshub";
import { Service, Context, Logger, Schema } from "koishi";

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

  protected start() {
    _RSSHub.init({
      //TODO: 默认配置
      CACHE_TYPE: null,
      CACHE_EXPIRE: 0,
      LOGGER_LEVEL: "emerg",
      ...this.config,
    });
    logger.debug("RSSHub launched");
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
