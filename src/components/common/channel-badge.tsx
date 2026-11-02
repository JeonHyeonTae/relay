import { Badge } from "@/components/ui/badge";
import { CHANNELS } from "@/lib/channels";
import type { ChannelId } from "@/lib/types";

export function ChannelBadge({ channel }: { channel: ChannelId }) {
  return <Badge className={CHANNELS[channel].color}>{CHANNELS[channel].short}</Badge>;
}
