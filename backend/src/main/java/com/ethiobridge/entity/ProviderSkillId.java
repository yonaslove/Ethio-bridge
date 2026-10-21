package com.ethiobridge.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class ProviderSkillId implements Serializable {

    @Column(name = "provider_profile_id")
    private UUID providerProfileId;

    @Column(name = "skill_id")
    private Long skillId;

    public ProviderSkillId() {}

    public ProviderSkillId(UUID providerProfileId, Long skillId) {
        this.providerProfileId = providerProfileId;
        this.skillId = skillId;
    }

    public UUID getProviderProfileId() { return providerProfileId; }
    public void setProviderProfileId(UUID providerProfileId) { this.providerProfileId = providerProfileId; }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProviderSkillId that)) return false;
        return Objects.equals(providerProfileId, that.providerProfileId) && Objects.equals(skillId, that.skillId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(providerProfileId, skillId);
    }
}
