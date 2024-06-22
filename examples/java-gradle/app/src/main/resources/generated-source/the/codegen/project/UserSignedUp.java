package the.codegen.project;

import java.util.Map;
import com.fasterxml.jackson.annotation.*;
public class UserSignedUp {
  @JsonProperty("displayName")
  @JsonInclude(JsonInclude.Include.NON_NULL)
  private String displayName;
  @JsonProperty("email")
  @JsonInclude(JsonInclude.Include.NON_NULL)
  private String email;
  @JsonInclude(JsonInclude.Include.NON_NULL)
  private Map<String, Object> additionalProperties;

  public String getDisplayName() { return this.displayName; }
  public void setDisplayName(String displayName) { this.displayName = displayName; }

  public String getEmail() { return this.email; }
  public void setEmail(String email) { this.email = email; }

  public Map<String, Object> getAdditionalProperties() { return this.additionalProperties; }
  public void setAdditionalProperties(Map<String, Object> additionalProperties) { this.additionalProperties = additionalProperties; }
}