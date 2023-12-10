override shadowDepthTextureSize: f32 = 8192.0; //2048.0;

struct VertexInput {
    @location(0) position : vec3f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
}

struct VertexOutput {
    @location(0) shadowPosition : vec3f,
    @builtin(position) position : vec4f,
    @location(1) fragPos : vec3f,
    @location(2) texcoords : vec2f,
    @location(3) normal : vec3f,
}

struct FragmentInput {
    @location(0) shadowPosition : vec3f,
    @location(1) fragPos : vec3f,
    @location(2) texcoords : vec2f,
    @location(3) normal : vec3f,
}

struct FragmentOutput {
    @location(0) color : vec4f,
}

struct CameraUniforms {
    viewMatrix : mat4x4f,
    projectionMatrix : mat4x4f,
}

struct LightUniforms {
    color : vec3f,
    direction : vec3f,
    //intensity : f32,
}

struct ModelUniforms {
    modelMatrix : mat4x4f,
    normalMatrix : mat3x3f,
}

struct MaterialUniforms {
    baseFactor : vec4f,
}

struct Scene {
    lightViewProjMatrix : mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> camera : CameraUniforms;

@group(1) @binding(0) var<uniform> light : LightUniforms;
// To je za sence
@group(1) @binding(1) var<uniform> scene : Scene;
@group(1) @binding(2) var shadowMap: texture_depth_2d;
@group(1) @binding(3) var shadowSampler: sampler_comparison;

@group(2) @binding(0) var<uniform> model : ModelUniforms;

@group(3) @binding(0) var<uniform> material : MaterialUniforms;
@group(3) @binding(1) var baseTexture : texture_2d<f32>;
@group(3) @binding(2) var baseSampler : sampler;

// const albedo = vec3<f32>(0.9);
const ambientFactor = 0.5;


// Homogenizirat, ce ni ortografska. Ce je ortografska, pa ne.
// Vrednosti x in y morajo biti med 0 in 1.
// Izriseva teksturo.
// Cifre morajo biti med rdeco in zeleno
// Poglejta ce se shadow map pravilno narise. To je 'z'.
// Probita dobit samo texturo od shadow mapa
// Nov shader, ki samo vzame teksturo in jo narise na zaslon.
// Ko ves enkrat da je tekstura v redu, je samo se vprasanje, ce je transformacija v redu.
// Al je tekstura al je pa transformacija problem. Drugo skor ne more bit.
@vertex
fn vertex(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    let positionFromLight = scene.lightViewProjMatrix * model.modelMatrix * vec4(input.position, 1);
    
    output.shadowPosition = vec3(
        positionFromLight.xy * vec2(0.5, -0.5) + vec2(0.5),
        positionFromLight.z
    );

    output.texcoords = input.texcoords;
    output.normal = model.normalMatrix * input.normal;
    output.position = camera.projectionMatrix * camera.viewMatrix * model.modelMatrix * vec4(input.position, 1);
    output.fragPos = input.position.xyz;
    return output;
}

@fragment
fn fragment(input : FragmentInput) -> @location(0) vec4<f32> {
    var visibility = 0.0;
    let oneOverShadowDepthTextureSize = 1.0 / shadowDepthTextureSize;
    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            let offset = vec2<f32>(vec2(x, y)) * oneOverShadowDepthTextureSize;

            visibility += textureSampleCompare(
                shadowMap, shadowSampler,
                input.shadowPosition.xy + offset, input.shadowPosition.z - 0.03 //0.007
                // Zamakniti moramo za tan(arccos(N skalarno L)) = 0.005
            );
        }
    }
    visibility /= 9.0;
    //visibility += 0.2;




    //var output : FragmentOutput;

    let N = normalize(input.normal);
    let L = light.direction;

    let lambert = max(dot(N, L), 0);
    //let lambert = max(dot(normalize(vec3(0, 15, 0) - input.fragPos), normalize(input.normal)), 0.0);
    //lambert -= 3;
    let shadowColor = vec3<f32>(0.008, 0.243, 0.541); // Pure blue

    let diffuseLight = lambert * light.color * 1.5;// * light.intensity;

    let shadowFactor = 1.0 - lambert;

    const gamma = 2.2;
    let baseColor = textureSample(baseTexture, baseSampler, input.texcoords) * material.baseFactor;
    let albedo = pow(baseColor.rgb, vec3(gamma));
    //let colorWithShadow = mix(albedo, shadowColor, shadowFactor);
    //let finalColor = albedo * diffuseLight;
    //let finalColor = colorWithShadow * diffuseLight;

    // Check if the surface is in shadow based on the lambert term
    // if (lambert > 0.4) {
    //     // Surface is directly lit. Use the standard lighting model.
    //     let diffuseLight = lambert * light.color;
    //     let finalColor = albedo * diffuseLight;
    //     output.color = pow(vec4(finalColor, 1), vec4(1 / gamma));
    // } else if(lambert > 0.0) {
    //     let colorWithShadow = mix(albedo, shadowColor, shadowFactor);
    //     let finalColor = colorWithShadow * diffuseLight;
    //     output.color = pow(vec4(finalColor, 1), vec4(1 / gamma));
    // } else {
    //     let finalColor = shadowColor;
    //     output.color = pow(vec4(finalColor, 1), vec4(1 / gamma));
    // }

    
   
    let lightingFactor = min(ambientFactor + visibility * lambert, 1.3) -0.15;
    
    //output.color = pow(vec4(finalColor, 1), vec4(1 / gamma));
    //return vec4(visibility, 0.0, 0.0, 1.0);
    return vec4(lightingFactor * albedo, 1.0);
    //return output;
}
