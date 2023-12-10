// Spremeni inpute tako, da se skladajo z vertex shaderjem

// struct VertexInput {
//     @location(0) position : vec3f,
//     @location(1) texcoords : vec2f,
//     @location(2) normal : vec3f,
// }

// struct Scene {
//   lightViewProjMatrix: mat4x4<f32>,
//   cameraViewProjMatrix: mat4x4<f32>,
//   lightPos: vec3<f32>,
// }

// struct Model {
//   modelMatrix: mat4x4<f32>,
// }

// @group(0) @binding(0) var<uniform> scene : Scene;
// @group(1) @binding(0) var<uniform> model : Model;

// @vertex
// fn main(
//   vertexinput: VertexInput
// ) -> @builtin(position) vec4<f32> {
//   return scene.lightViewProjMatrix * model.modelMatrix * vec4(vertexinput.position, 1.0);
// }
struct VertexInput {
    @location(0) position : vec3f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
}

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
}

// struct FragmentInput {
//     @location(1) texcoords : vec2f,
//     @location(2) normal : vec3f,
// }

// struct FragmentOutput {
//     @location(0) color : vec4f,
// }

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

@group(0) @binding(0) var<uniform> camera : CameraUniforms;

@group(1) @binding(0) var<uniform> light : LightUniforms;

@group(2) @binding(0) var<uniform> model : ModelUniforms;

@group(3) @binding(0) var<uniform> material : MaterialUniforms;
@group(3) @binding(1) var baseTexture : texture_2d<f32>;
@group(3) @binding(2) var baseSampler : sampler;

@vertex
fn main(input : VertexInput) -> @builtin(position) vec4<f32> {

  
  return  camera.projectionMatrix * camera.viewMatrix * model.modelMatrix * vec4(input.position, 1.0);
 
}

// @fragment
// fn fragment(input: FragmentInput) -> FragmentOutput {
//     var output : FragmentOutput;
//     output.color = input;
//     return output;
// }