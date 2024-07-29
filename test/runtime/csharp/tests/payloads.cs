using NUnit.Framework;
using System.Text.Json;

namespace The.Codegen.Project
{
    [TestFixture]
    public class PayloadTestingJson
    {
        [Test]
        public void ShouldBeSerializableModel ()
        {
            var model = new Json.UserSignedUp
            {
                DisplayName = "displayNameTest",
                Email = "emailTest"
            };
            var json = JsonSerializer.Serialize(model);
            var expectedJson = "{\"display_name\":\"displayNameTest\",\"email\":\"emailTest\"}";
            Assert.AreEqual(json, expectedJson);
        }
        [Test]
        public void ShouldBeDeserializeToModel()
        {
            var json = "{\"display_name\":\"displayNameTest\",\"email\":\"emailTest\"}";
            var deserializeOptions = new JsonSerializerOptions();
            deserializeOptions.Converters.Add(new Json.UserSignedUpConverter());
            var model = JsonSerializer.Deserialize<Json.UserSignedUp>(json, deserializeOptions);
            Assert.AreEqual(model.DisplayName, "displayNameTest");
            Assert.AreEqual(model.Email, "emailTest");
        }
        [Test]
        public void ShouldBeSerializableModelInRoundtrip()
        {
            var model = new Json.UserSignedUp
            {
                DisplayName = "displayNameTest",
                Email = "emailTest"
            };
            var json = JsonSerializer.Serialize(model);

            var deserializeOptions = new JsonSerializerOptions();
            deserializeOptions.Converters.Add(new Json.UserSignedUpConverter());
            var newModel = JsonSerializer.Deserialize<Json.UserSignedUp> (json, deserializeOptions);
            var newJson = JsonSerializer.Serialize(newModel);
            Assert.AreEqual(json, newJson);
        }
    }
    [TestFixture]
    public class PayloadTestingNewtonsoft
    {
        [Test]
        public void ShouldBeSerializableModel()
        {
            var model = new Newtonsoft.UserSignedUp
            {
                DisplayName = "displayNameTest",
                Email = "emailTest"
            };
            var json = model.Serialize();
            var expectedJson = "{\"display_name\":\"displayNameTest\",\"email\":\"emailTest\"}";
            Assert.AreEqual(json, expectedJson);
        }
        [Test]
        public void ShouldBeDeserializeToModel()
        {
            var json = "{\"display_name\":\"displayNameTest\",\"email\":\"emailTest\"}";
            var model = Newtonsoft.UserSignedUp.Deserialize(json);
            Assert.AreEqual(model.DisplayName, "displayNameTest");
            Assert.AreEqual(model.Email, "emailTest");
        }
        [Test]
        public void ShouldBeSerializableModelInRoundtrip()
        {
            var model = new Newtonsoft.UserSignedUp
            {
                DisplayName = "displayNameTest",
                Email = "emailTest"
            };
            var json = model.Serialize();
            var newModel = Newtonsoft.UserSignedUp.Deserialize(json);
            var newJson = newModel.Serialize();
            Assert.AreEqual(json, newJson);
        }
    }
}