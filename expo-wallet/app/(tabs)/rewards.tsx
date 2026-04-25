import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useAppContext } from "@/context/app-context";
import { AppScreen, Card, SectionHeader, SettingRow, StatCard } from "@/components/trust-ui";

export default function RewardsScreen() {
  const { rewardRedeemItems, rewardsCampaigns, socialLinks, theme, trustAlphaCampaigns } = useAppContext();
  const [redeemTab, setRedeemTab] = useState<"active" | "past">("active");
  const [alphaTab, setAlphaTab] = useState<"active" | "past">("active");
  const pastAlphaRows = [
    { id: "atwo", title: "Earn ATWO with TWT", reward: "5M ATWO", badge: "◉", badgeBg: "#fff42b", badgeFg: "#111" },
    { id: "cred", title: "Earn CRED with TWT", reward: "5M CRED", badge: "⬢", badgeBg: "#111", badgeFg: "#fff" },
    { id: "elde", title: "Earn ELDE with TWT", reward: "1.66M ELDE", badge: "E", badgeBg: "#f6c14b", badgeFg: "#9c5f00" },
    { id: "ltp", title: "Earn LTP with TWT", reward: "150K LTP", badge: "◔", badgeBg: "#fff7db", badgeFg: "#ba7a00" },
    { id: "wod", title: "Earn WOD with TWT", reward: "3M WOD", badge: "◫", badgeBg: "#7266ff", badgeFg: "#fff" },
  ];

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: 18, gap: 18 }}>
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900", textAlign: "center", paddingTop: 8 }}>Rewards</Text>

        <View style={{ alignItems: "center", paddingTop: 8 }}>
          <RewardsHeroArt />
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatCard label="Level" value="100 XP to Bronze" />
          <StatCard label="XP Balance" value="0 XP" />
        </View>

        <View style={{ gap: 12 }}>
          <SectionHeader title="Redeem XP" />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <RewardsToggle label="Active" active={redeemTab === "active"} onPress={() => setRedeemTab("active")} />
            <RewardsToggle label="Past" active={redeemTab === "past"} onPress={() => setRedeemTab("past")} />
          </View>

          {redeemTab === "active" ? (
            <Card muted>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <GiftBoxArt />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: theme.secondary, fontSize: 14, fontWeight: "700" }}>New campaigns coming soon</Text>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", lineHeight: 25 }}>Follow us on socials and be the first to know!</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 4 }}>
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "#17191f", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>X</Text>
                </View>
                <Text style={{ flex: 1, color: theme.text, fontSize: 18, fontWeight: "900" }}>@TrustWallet</Text>
                <Pressable style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#d8d4ff", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: theme.blue, fontSize: 24, fontWeight: "900" }}>→</Text>
                </Pressable>
              </View>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {rewardRedeemItems.map((item, index) => (
                <Card key={item.id} muted>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <PastBadge tone={index % 2 === 0 ? "blue" : "gold"} label={item.partner.slice(0, 1)} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{item.title}</Text>
                      <Text style={{ color: theme.secondary, fontSize: 15 }}>{item.partner}</Text>
                    </View>
                    <Text style={{ color: theme.secondary, fontSize: 14, fontWeight: "800" }}>{item.cost} XP</Text>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        <SectionHeader title="Trust Alpha" actionLabel="›" onPress={() => router.push("/trade")} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <RewardsToggle label="Active" active={alphaTab === "active"} onPress={() => setAlphaTab("active")} />
          <RewardsToggle label="Past" active={alphaTab === "past"} onPress={() => setAlphaTab("past")} />
        </View>

        {alphaTab === "active" ? (
          <Card muted>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <RocketArt />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: theme.secondary, fontSize: 14, fontWeight: "700" }}>You're all caught up</Text>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", lineHeight: 25 }}>No campaigns running at the moment</Text>
              </View>
            </View>
            <View style={{ paddingTop: 6, gap: 10 }}>
              {socialLinks.slice(0, 2).map((link) => (
                <SettingRow key={link.label} icon={link.label.slice(0, 1)} title={link.label} subtitle={link.url.replace("https://", "")} value="Open" />
              ))}
            </View>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {pastAlphaRows.map((row) => (
              <Card key={row.id} muted>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={{ flex: 1, gap: 18 }}>
                    <Text style={{ color: theme.text, fontSize: 19, fontWeight: "900" }}>{row.title}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={{ color: theme.secondary, fontSize: 16 }}>⌘</Text>
                      <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>{row.reward}</Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: theme.border, marginLeft: 8 }} />
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 18 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: row.badgeBg, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: row.badgeFg, fontSize: 20, fontWeight: "900" }}>{row.badge}</Text>
                    </View>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#d8d4ff", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: theme.blue, fontSize: 24, fontWeight: "900" }}>→</Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={{ gap: 10 }}>
          {rewardsCampaigns.slice(0, 2).map((campaign) => (
            <Card key={campaign.id}>
              <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{campaign.title}</Text>
              <Text style={{ color: theme.secondary, fontSize: 14, lineHeight: 20 }}>{campaign.subtitle}</Text>
              <Text style={{ color: theme.blue, fontSize: 14, fontWeight: "900" }}>{campaign.reward}</Text>
            </Card>
          ))}
          {trustAlphaCampaigns.slice(0, 1).map((campaign) => (
            <Card key={campaign.id} muted>
              <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{campaign.title}</Text>
              <Text style={{ color: theme.secondary, fontSize: 14, lineHeight: 20 }}>{campaign.subtitle}</Text>
              <Text style={{ color: theme.blue, fontSize: 14, fontWeight: "900" }}>{campaign.reward}</Text>
            </Card>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

function RewardsToggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 42, paddingHorizontal: 18, borderRadius: 21, backgroundColor: active ? "#f0f0f2" : "transparent", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: active ? "#1b1d24" : "#9ca1aa", fontSize: 17, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function RewardsHeroArt() {
  return (
    <View style={{ width: 150, height: 120, alignItems: "center", justifyContent: "center" }}>
      <LinearGradient colors={["#64ffbd", "#d1ff5c", "#68d9ff"]} style={{ width: 92, height: 64, borderRadius: 18, transform: [{ rotate: "-16deg" }], borderWidth: 2, borderColor: "#0f1115" }} />
      <View style={{ position: "absolute", width: 60, height: 44, borderRadius: 12, backgroundColor: "#0f1115", top: 18, left: 60, transform: [{ rotate: "18deg" }] }} />
      <View style={{ position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: "#1849ff", top: 14, right: 34 }} />
      <View style={{ position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: "#5b39ff", top: 6, right: 18 }} />
      <View style={{ position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#ff7ad9", top: 22, left: 22 }} />
      <View style={{ position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: "#20242d", top: 46, right: 22 }} />
    </View>
  );
}

function GiftBoxArt() {
  return (
    <View style={{ width: 76, height: 76, alignItems: "center", justifyContent: "center" }}>
      <LinearGradient colors={["#eef2ff", "#dce7ff", "#c5d2ff"]} style={{ width: 52, height: 42, borderRadius: 10, borderWidth: 2, borderColor: "#4a5cff" }} />
      <View style={{ position: "absolute", width: 54, height: 16, borderRadius: 8, backgroundColor: "#4a5cff", top: 18 }} />
      <View style={{ position: "absolute", width: 14, height: 44, borderRadius: 6, backgroundColor: "#8db0ff" }} />
    </View>
  );
}

function RocketArt() {
  return (
    <View style={{ width: 76, height: 76, alignItems: "center", justifyContent: "center" }}>
      <LinearGradient colors={["#f5b8ff", "#8e80ff", "#2b4dff"]} style={{ width: 28, height: 54, borderRadius: 18, transform: [{ rotate: "24deg" }] }} />
      <View style={{ position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: "#ffb5c9", left: 10, bottom: 20 }} />
      <View style={{ position: "absolute", width: 16, height: 16, borderRadius: 8, backgroundColor: "#64ffbd", left: 22, bottom: 12 }} />
    </View>
  );
}

function PastBadge({ tone, label }: { tone: "blue" | "gold"; label: string }) {
  const backgroundColor = tone === "blue" ? "#d9dcff" : "#fff0c9";
  const color = tone === "blue" ? "#4d56ff" : "#b57400";

  return (
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color, fontSize: 18, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}
