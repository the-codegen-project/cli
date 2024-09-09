using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Linq;


namespace The.Codegen.Project
{
  [JsonConverter(typeof(UserSignedUpConverter))]
  public partial class UserSignedUp
  {
    private string? displayName;
    private string? email;
    private Dictionary<string, dynamic>? additionalProperties;

    public string? DisplayName 
    {
      get { return displayName; }
      set { this.displayName = value; }
    }

    public string? Email 
    {
      get { return email; }
      set { this.email = value; }
    }

    public Dictionary<string, dynamic>? AdditionalProperties 
    {
      get { return additionalProperties; }
      set { this.additionalProperties = value; }
    }


      public string Serialize()
      {
        return this.Serialize(null);
      }
      public string Serialize(JsonSerializerOptions options = null) 
      {
        return JsonSerializer.Serialize(this, options);
      }
      public static UserSignedUp Deserialize(string json)
      {
        var deserializeOptions = new JsonSerializerOptions();
        deserializeOptions.Converters.Add(new UserSignedUpConverter());
        return JsonSerializer.Deserialize<UserSignedUp>(json, deserializeOptions);
      }
  }

  internal class UserSignedUpConverter : JsonConverter<UserSignedUp>
  {
    public override bool CanConvert(System.Type objectType)
    {
      // this converter can be applied to any type
      return true;
    }
    public override UserSignedUp Read(ref Utf8JsonReader reader, System.Type typeToConvert, JsonSerializerOptions options)
    {
      if (reader.TokenType != JsonTokenType.StartObject)
      {
        throw new JsonException();
      }

      var instance = new UserSignedUp();
  
      while (reader.Read())
      {
        if (reader.TokenType == JsonTokenType.EndObject)
        {
          return instance;
        }

        // Get the key.
        if (reader.TokenType != JsonTokenType.PropertyName)
        {
          throw new JsonException();
        }

        string propertyName = reader.GetString();
        if (propertyName == "displayName")
          {
            var value = JsonSerializer.Deserialize<string?>(ref reader, options);
            instance.DisplayName = value;
            continue;
          }
        if (propertyName == "email")
          {
            var value = JsonSerializer.Deserialize<string?>(ref reader, options);
            instance.Email = value;
            continue;
          }
        if(instance.AdditionalProperties == null) { instance.AdditionalProperties = new Dictionary<string, dynamic>(); }
              var deserializedValue = JsonSerializer.Deserialize<Dictionary<string, dynamic>?>(ref reader, options);
              instance.AdditionalProperties.Add(propertyName, deserializedValue);
              continue;
      }
  
      throw new JsonException();
    }
    public override void Write(Utf8JsonWriter writer, UserSignedUp value, JsonSerializerOptions options)
    {
      if (value == null)
      {
        JsonSerializer.Serialize(writer, null, options);
        return;
      }
      var properties = value.GetType().GetProperties().Where(prop => prop.Name != "AdditionalProperties");
  
      writer.WriteStartObject();

      if(value.DisplayName != null) {
        // write property name and let the serializer serialize the value itself
        writer.WritePropertyName("displayName");
        JsonSerializer.Serialize(writer, value.DisplayName, options);
      }
      if(value.Email != null) {
        // write property name and let the serializer serialize the value itself
        writer.WritePropertyName("email");
        JsonSerializer.Serialize(writer, value.Email, options);
      }
      // Unwrap dictionary properties
      if (value.AdditionalProperties != null) {
        foreach (var unwrappedProperty in value.AdditionalProperties)
        {
          // Ignore any unwrapped properties which might already be part of the core properties
          if (properties.Any(prop => prop.Name == unwrappedProperty.Key))
          {
              continue;
          }
          // Write property name and let the serializer serialize the value itself
          writer.WritePropertyName(unwrappedProperty.Key);
          JsonSerializer.Serialize(writer, unwrappedProperty.Value, options);
        }
      }

      writer.WriteEndObject();
    }

  }

}