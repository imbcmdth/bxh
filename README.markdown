[![build status](https://secure.travis-ci.org/imbcmdth/bxh.png)](http://travis-ci.org/imbcmdth/bxh)
# B*H

_Bounding Interval and Bounding Volume Hierarchies for Node.js_

## Introduction

[Bounding Interval Hierarchies](http://en.wikipedia.org/wiki/Bounding_interval_hierarchy) (BIH) and [Bounding Volume Hierarchies](http://en.wikipedia.org/wiki/Bounding_volume_hierarchy) (BVH) are data structures that hierarchically divide a region of space in order to reduce the number of elements that must be considered when performing spatial queries.

[Space partitioning](http://en.wikipedia.org/wiki/Space_partitioning) structures such as these help to dramatically speed up the processes of finding all the elements within a region or finding the intersection between a ray and a set of elements.

Both B*H trees have exactly the same API and can be used interchangably.

The B*H is written to be agnostic to the number of dimensions. Though the trees should function in higher dimensions they have only been tested in the traditional 2-D and 3-D layouts.

All traversal algorithms are non-recursive. The tree building phase is performed using the "Surface Area Hueristic" that produces pretty good, though potentially unbalanced, trees.

## Installation

Using `npm`, installation is straightforward:

    npm install bxh

## Usage

    var BxH  = require('bxh'),
        BIH  = BxH.BIH,
        BVH  = BxH.BVH,
        AABB = BxH.AABB,
        Ray = BxH.Ray,
        IntersectInfo = BxH.IntersectInfo;

## Examples

TODO

## APIs

### B*H

#### <span class="heading">constructor</span> `(dimensions = 3, minimumLeafSize = 2, maximumLeafSize = 4)`

`dimensions` the number of dimensions of space within the tree.

`minimumLeafSize` the minimum number of elements a leaf can contain.

`maximumLeafSize` the maximum number of elements a leaf can contain.

Constructs a new B*H element with the specified parameters.

#### <span class="heading">buildFromArrayOfElements</span> `(arrayOfElements)`

`arrayOfElements` a collection of elements from which to build the tree.

Builds the tree structure for an array of provided elements, calling `element.getAABB()` and `element.getWeight()` as necessary.

#### <span class="heading">buildFromArrayOfElementsAsync</span> `(arrayOfElements, progressCallback = null, finishedCallback = null)`

`arrayOfElements` a collection of elements from which to build the tree.

`progressCallback` an optional function to call, roughly every second, with progress information about the build process.

`finishedCallback` an optional function to call when the building process is completed.

Asynchronously builds the tree structure for an array of provided elements, calling `element.getAABB()` and `element.getWeight()` as necessary.

#### <span class="heading">buildFromArrayOfNodes</span> `(arrayOfNodes)`

`arrayOfNodes` a collection of nodes from which to build the tree.

Builds the tree structure for an array of provided nodes. Doesn't require either `element.getAABB()` nor `element.getWeight()` to be present.

#### <span class="heading">buildFromArrayOfNodesAsync</span> `(arrayOfNodes, progressCallback = null, finishedCallback = null)`

`arrayOfNodes` a collection of nodes from which to build the tree.

`progressCallback` an optional function to call, roughly every second, with progress information about the build process.

`finishedCallback` an optional function to call when the building process is completed.

Asynchronously builds the tree structure for an array of provided nodes. Doesn't require either `element.getAABB()` nor `element.getWeight()` to be present.

#### <span class="heading">intersect</span> `(ray, intersectInfo)`

`ray` an instance of BxH.Ray

`intersectionInfo`

Returns nothing. On a successful intersection, the provided intesectInfo element must be modified in-place by the intersection routine that each element possesses. The intersectInfo element helps guide the remaining tree traversal and it is critical that it's properties are set by an element's intersection routine if an intersection occurs.

#### <span class="heading">overlaps</span> `(AABB, returnArray = [])`

`AABB` the AABB element that defines a region of interest.

`returnArray` an optional array used to store the elements that meet the function's criteria.

Returns an array of all the elements that overlap the region defined in the AABB argument.

#### <span class="heading">contains</span> `(AABB, returnArray = [])`

`AABB` the AABB element that defines a region of interest.

`returnArray` an optional array used to store the elements that meet the function's criteria.

Returns an array of all the elements that are completely contained by the region defined in the AABB argument.

#### <span class="heading">contained</span> `(AABB, returnArray = [])`

`AABB` the AABB element that defines a region of interest.

`returnArray` an optional array used to store the elements that meet the function's criteria.

Returns an array of all the elements that completely contain the region defined in the AABB argument.

### AABB

#### <span class="heading">constructor</span> `(min = [0,0,0], max = [0,0,0])`

`min` the minimum coordinates of the AABB. In a 2-D AABB in screen space, the coordinates for the upper-left corner.

`max` the maximum coordinates of the AABB. In a 2-D AABB in screen space, the coordinates for the lower-right corner.

Constructs a new AABB of dimensionality equal to `min.length` using the specified bounds.

*NOTE* The number of elements in `min` and `max` (ie. the dimensions) must be the same.

#### <span class="heading">getLength</span> `(axis)`

`axis` the zero-based array index representing a particular axis. By convention, 0 = x, 1 = y, 2 = z, and so on.

Returns the length of the AABB along the side defined by `axis`.

#### <span class="heading">getLengths</span> `()`

Returns an array containing the lengths of all sides of the AABB.

#### <span class="heading">expandByAABB</span> `(otherAABB)`

Expand `this` to contain `otherAABB`.

#### <span class="heading">expandToContainElements</span> `(elements, startAt = 0)`

`elements` an array of elements.

`startAt` offset into the `elments` which to start at.

Expand `this` to contain all `elements`.

#### <span class="heading">makeToContainElements</span> `(elements)`

`elements` an array of elements.

Return a new AABB that contains the bounds of all `elements`.

#### <span class="heading">overlaps</span> `(otherAABB)`

Returns `true` if `this` and `otherAABB` overlap each other.

#### <span class="heading">contains</span> `(otherAABB)`

Returns `true` if `this` completely contains `otherAABB`.

#### <span class="heading">contained</span> `(otherAABB)`

Returns `true` if `this` is completely contained by `otherAABB`.

#### <span class="heading">getSurfaceArea</span> `()`

Returns the surface area of the AABB. In the 2 dimension case, this is the AABB's perimeter.

#### <span class="heading">getVolume</span> `()`

Returns the volume of the AABB. In the 2 dimension case, this is the AABB's area.

#### <span class="heading">clone</span> `()`

Returns a clone of `this`.

#### <span class="heading">intersectWithRay</span> `(ray)`

`ray` a ray to test against.

Returns `false` is no intersection is possible. Otherwise, returns the portion of the ray (a ray segment) that results from the intersection of the ray with the AABB.

#### <span class="heading">intersectWithSegment</span> `(rs)`

`rs` - a ray segment to test against.

Returns `false` is no intersection is possible. Otherwise, returns the portion of the ray segment that results from the intersection of the ray segment with the AABB.

### Ray

#### <span class="heading">constructor</span> `(position = [0,0,0], direction = [0,0,0], dimensions = 3)`

`position` point of origin of the ray.

`direction` a vector that represents the direction of the ray.

Constructs a ray originating at `position` in direction `direction` with `minT` equal to 0 and `maxT` equal to 2**53.

#### <span class="heading">toIntervals</span> `()`

Returns a ray segment for this ray that spans from `this.minT` to `this.maxT`.

#### <span class="heading">getMajorAxis</span> `()`

Returns the 0-based axis that represent the component of vector `this.direction` with the greatest magnitude.

### IntersectInfo

#### <span class="heading">constructor</span> `()`

Constructs an empty IntersectInfo structure. Intersection routines are expected to fill out the IntersectInfo structure's `this.isHit` and `this.position` with `true` and the position of the nearest intersection on a successful intersect test.

## Appendix

### Definitions

#### AABB
[Axis aligned bounding box](http://en.wikipedia.org/wiki/Axis-aligned_bounding_box).

#### BIH
[Bounding Interval Hierarchy](http://en.wikipedia.org/wiki/Bounding_interval_hierarchy). A tree that recursively splits space along two potentially overlapping planes.

#### BVH
[Bounding Volume Hierarchy](http://en.wikipedia.org/wiki/Bounding_volume_hierarchy). A tree that recursively splits space into volumes (AABBs in this implementation) The volumes minimally bound their contents.

#### Element
What the tree contains. A JavaScript object that provides a minimum set of required functions and can therefore be inserted into the tree directly.

The required functions are:

`getAABB()` Return an AABB bounding the element.

`getWeight()` Return a positive number representing the complexity of the element (ie. cost of performing the tests below).

`intersect(ray, intersectInfo)` Performs an intersection test against ray. Only required if you wish to run `B*H.intersect`.

`overlaps(AABB)` Return true if and only if the element overlaps or is contained by the region defined by AABB. Only required if you wish to run `B*H.overlaps`.

`contains(AABB)` Return true if and only if the element completely contains the region defined by AABB. Required if you wish to run `B*H.contains` or `B*H.contained`.

`contained(AABB)` Return true if and only if the element is completely contained by the region defined by AABB. Required if you wish to run `B*H.contains` or `B*H.contained`.

*NOTE* If you want to insert objects into the tree that don't contain these functions you can manually construct `Nodes` for your JavaScript objects that have the format specified below and then create the tree them using the buildFromArrayOfNodes* functions.

#### Node
A JavaScript object that contains the following properties:

`i` The AABB for the contained element

`w` The weight of the contained element

`o` The element itself.

`iFn` A function to use for intersecting element `o`.

`oFn` A function to use for performing the overlaps test on element `o`.

`csFn` A function to use for performing the contains test on element `o`.

`cdFn` A function to use for performing the contained test on element `o`.

#### Ray
A line segment defined by a starting point, `position`, a direction vector, `direction`, and two sets of parameters `minT` and `maxT` that define where along the ray the line segment begins and ends. [More info.](http://en.wikipedia.org/wiki/Ray_%28geometry%29#Ray)

#### Ray Segment
Used internally by B*H, a ray segment is a line segment defined by starting and end points. A ray segment is an array with an object for each dimension.

Each object (one per dimension) has the format of:

`{a: starting position, b: ending position}`

#### Weight
The relative cost associated with searching for an element. Most of the time the tree will contain only one type of element so their weights will all be the same value.

