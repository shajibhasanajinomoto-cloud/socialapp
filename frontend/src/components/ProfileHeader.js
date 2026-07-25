import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";

export default function ProfileHeader({
  user,
  friendsCount,
  isOwnProfile,
  onEditCover,
  onEditAvatar,
  uploadingCover,
  uploadingAvatar,
  actions, // JSX for the button row (Add Friend/Message/Call or Edit Profile)
  onEditPersonalDetails,
  onPressFamilyMember,
}) {
  const bioRows = [
    { icon: "💼", value: user?.work },
    { icon: "🎓", value: user?.education },
    { icon: "📍", value: user?.location },
    {
      icon: "🎂",
      value: user?.birthday
        ? new Date(user.birthday).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
        : null,
    },
  ].filter((row) => row.value);

  const relationshipLabel = user?.relationshipStatus
    ? user.relationshipSince
      ? `${user.relationshipStatus} since ${new Date(user.relationshipSince).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`
      : user.relationshipStatus
    : null;

  const hasPersonalDetails =
    !!user?.location || !!user?.hometown || !!user?.relationshipStatus || (user?.familyMembers?.length ?? 0) > 0;

  const CoverWrapper = isOwnProfile ? TouchableOpacity : View;
  const AvatarWrapper = isOwnProfile ? TouchableOpacity : View;

  return (
    <View style={styles.header}>
      <CoverWrapper onPress={isOwnProfile ? onEditCover : undefined} style={styles.coverWrapper}>
        {user?.coverImageUrl ? (
          <Image source={{ uri: user.coverImageUrl }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}
        {isOwnProfile && (
          <View style={styles.coverEditBadge}>
            {uploadingCover ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.editBadgeText}>📷 Edit Cover</Text>
            )}
          </View>
        )}
      </CoverWrapper>

      <AvatarWrapper onPress={isOwnProfile ? onEditAvatar : undefined} style={styles.avatarWrapper}>
        <Image
          source={{ uri: user?.avatarUrl || "https://placehold.co/90x90" }}
          style={styles.avatar}
        />
        {isOwnProfile && (
          <View style={styles.avatarEditBadge}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.avatarEditIcon}>📷</Text>
            )}
          </View>
        )}
      </AvatarWrapper>

      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.statsLine}>{friendsCount ?? 0} friends</Text>

      {bioRows.length > 0 && (
        <View style={styles.bioSection}>
          {bioRows.map((row, i) => (
            <View key={i} style={styles.bioRow}>
              <Text style={styles.bioIcon}>{row.icon}</Text>
              <Text style={styles.bioText}>{row.value}</Text>
            </View>
          ))}
        </View>
      )}

      {!!user?.bio && <Text style={styles.bioQuote}>{user.bio}</Text>}

      <View style={styles.actionsRow}>{actions}</View>

      {(hasPersonalDetails || isOwnProfile) && (
        <View style={styles.detailsSection}>
          <View style={styles.detailsHeaderRow}>
            <Text style={styles.detailsHeading}>Personal details</Text>
            {isOwnProfile && (
              <TouchableOpacity onPress={onEditPersonalDetails}>
                <Text style={styles.detailsEditIcon}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>

          {user?.location ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{user.location}</Text>
            </View>
          ) : null}

          {user?.hometown ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🏠</Text>
              <Text style={styles.detailText}>{user.hometown}</Text>
            </View>
          ) : null}

          {relationshipLabel ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>❤️</Text>
              <View>
                <Text style={styles.detailText}>{user.relationshipStatus}</Text>
                {user.relationshipSince ? (
                  <Text style={styles.detailSubText}>
                    Since{" "}
                    {new Date(user.relationshipSince).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {user?.familyMembers?.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🌳</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailText}>Family</Text>
                <View style={styles.familyList}>
                  {user.familyMembers.map((member, i) => (
                    <TouchableOpacity
                      key={member.user?._id || i}
                      style={styles.familyItem}
                      onPress={() => onPressFamilyMember?.(member.user?._id)}
                    >
                      <Image
                        source={{ uri: member.user?.avatarUrl || "https://placehold.co/32x32" }}
                        style={styles.familyAvatar}
                      />
                      <View>
                        <Text style={styles.familyName}>{member.user?.name}</Text>
                        <Text style={styles.familyRelation}>{member.relation}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {!hasPersonalDetails && isOwnProfile && (
            <TouchableOpacity onPress={onEditPersonalDetails}>
              <Text style={styles.detailsAddText}>+ Add hometown, relationship, or family</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 20 },
  coverWrapper: { width: "100%", height: 150, marginBottom: -45 },
  cover: { width: "100%", height: 150, backgroundColor: "#dbeafe" },
  coverPlaceholder: { width: "100%", height: 150, backgroundColor: "#dbeafe" },
  coverEditBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  editBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  avatarWrapper: { marginTop: 45 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#eee", borderWidth: 3, borderColor: "#fff" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563eb",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarEditIcon: { fontSize: 12 },
  name: { fontSize: 21, fontWeight: "700", marginTop: 10 },
  statsLine: { color: "#777", fontSize: 13, marginTop: 2 },
  bioSection: { alignSelf: "stretch", paddingHorizontal: 24, marginTop: 14, gap: 6 },
  bioRow: { flexDirection: "row", alignItems: "center" },
  bioIcon: { fontSize: 15, marginRight: 8 },
  bioText: { fontSize: 14, color: "#333" },
  bioQuote: { fontSize: 13, color: "#555", fontStyle: "italic", marginTop: 10, paddingHorizontal: 24, textAlign: "center" },
  actionsRow: { flexDirection: "row", marginTop: 16, gap: 24, alignItems: "center" },
  detailsSection: { alignSelf: "stretch", paddingHorizontal: 20, marginTop: 18, gap: 14 },
  detailsHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  detailsHeading: { fontSize: 17, fontWeight: "700" },
  detailsEditIcon: { fontSize: 14 },
  detailRow: { flexDirection: "row", alignItems: "flex-start" },
  detailIcon: { fontSize: 17, marginRight: 12, width: 20 },
  detailText: { fontSize: 15, fontWeight: "600", color: "#222" },
  detailSubText: { fontSize: 12, color: "#777", marginTop: 1 },
  detailsAddText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  familyList: { marginTop: 8, gap: 10 },
  familyItem: { flexDirection: "row", alignItems: "center" },
  familyAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: "#eee" },
  familyName: { fontSize: 13, fontWeight: "600", color: "#222" },
  familyRelation: { fontSize: 11, color: "#777" },
});
