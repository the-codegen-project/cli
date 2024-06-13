package the.codegen.project;

import static org.junit.Assert.*;

import org.junit.Before;
import org.junit.Test;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.*;
import the.codegen.project.payloads.UserSignedUpPayload;

public class UserSignedUpPayloadTest {
	UserSignedUpPayload obj = new UserSignedUpPayload();
	@Before
	public void before() {
		obj.setDisplayName("displayNameTest");
		obj.setEmail("emailTest");
	}

    @Test
    public void shouldBeAbleToSerializeModel() throws JsonProcessingException
    {
    	ObjectMapper objectMapper = new ObjectMapper();
    	String json = objectMapper.writeValueAsString(obj);
		String expectedJson = "{\"display_name\":\"displayNameTest\",\"email\":\"emailTest\"}";
        assertNotNull(json);
		assertEquals(json, expectedJson);
    }
}
