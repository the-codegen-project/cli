using System.Text.Json;
using The.Codegen.Project;

namespace csharp.tests;

public class PayloadTestingJson
{
    [Test]
    public void ShouldBeSerializableModel()
    {
        var model = new The.Codegen.Project.Json.UserSignedUpPayload
        {
            DisplayName = "displayNameTest",
            Email = "emailTest"
        };
        var json = JsonSerializer.Serialize(model);
        var expectedJson = "{\"display_name\":\"displayNameTest\",\"email\":\"emailTest\"}";
        Assert.That(expectedJson, Is.EqualTo(json));
    }
    [Test]
    public void ShouldBeDeserializeToModel()
    {
        var json = "{\"display_name\":\"displayNameTest\",\"email\":\"emailTest\"}";
        var model = The.Codegen.Project.Json.UserSignedUpPayload.Deserialize(json);
        Assert.That("displayNameTest", Is.EqualTo(model.DisplayName));
        Assert.That("emailTest", Is.EqualTo(model.Email));
    }
    [Test]
    public void ShouldBeSerializableModelInRoundtrip()
    {
        var model = new The.Codegen.Project.Json.UserSignedUpPayload
        {
            DisplayName = "displayNameTest",
            Email = "emailTest"
        };
        var json = JsonSerializer.Serialize(model);

        var deserializeOptions = new JsonSerializerOptions();
        deserializeOptions.Converters.Add(new The.Codegen.Project.Json.UserSignedUpPayloadConverter());
        var newModel = JsonSerializer.Deserialize<The.Codegen.Project.Json.UserSignedUpPayload>(json, deserializeOptions);
        var newJson = JsonSerializer.Serialize(newModel);
        Assert.That(newJson, Is.EqualTo(json));
    }
}
[TestFixture]
public class PayloadTestingNewtonsoft
{
    [Test]
    public void ShouldBeSerializableModel()
    {
        var model = new The.Codegen.Project.Newtonsoft.UserSignedUpPayload
        {
            DisplayName = "displayNameTest",
            Email = "emailTest"
        };
        var json = model.Serialize();
        var expectedJson = "{\"display_name\":\"displayNameTest\",\"email\":\"emailTest\"}";
        Assert.That(expectedJson, Is.EqualTo(json));
    }
    [Test]
    public void ShouldBeDeserializeToModel()
    {
        var json = "{\"display_name\":\"displayNameTest\",\"email\":\"emailTest\"}";
        var model = The.Codegen.Project.Newtonsoft.UserSignedUpPayload.Deserialize(json);
        Assert.That("displayNameTest", Is.EqualTo(model.DisplayName));
        Assert.That("emailTest", Is.EqualTo(model.Email));
    }
    [Test]
    public void ShouldBeSerializableModelInRoundtrip()
    {
        var model = new The.Codegen.Project.Newtonsoft.UserSignedUpPayload
        {
            DisplayName = "displayNameTest",
            Email = "emailTest"
        };
        var json = model.Serialize();
        var newModel = The.Codegen.Project.Newtonsoft.UserSignedUpPayload.Deserialize(json);
        var newJson = newModel.Serialize();
        Assert.That(newJson, Is.EqualTo(json));
    }
}
