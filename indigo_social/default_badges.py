from django.dispatch import receiver
from django.contrib.auth.models import User
from django.conf import settings
from allauth.account.signals import user_signed_up

from indigo_social.badges import PermissionBadge, badges


# ------------------------------------------------------------------------
# Default Badge definitions
#
# You can define your own badges, either in addition to these (in your
# own module), or in favour of these (by changing settings.INDIGO_SOCIAL['badges']
# to the module name. The badges will be imported when the app starts up.


class ContentAPIBadge(PermissionBadge):
    slug = 'content-api'
    name = 'Content API'
    group_name = name + ' Badge'
    description = 'Can use the Content API'
    permissions = ('indigo_api.view_published_document',)


class ContributorBadge(PermissionBadge):
    slug = 'contributor'
    name = 'Contributor'
    group_name = name + ' Badge'
    description = 'Can view work details'
    permissions = (
        'indigo_api.view_annotation', 'indigo_api.add_annotation', 'indigo_api.change_annotation', 'indigo_api.delete_annotation',
        'indigo_api.view_work', 'indigo_api.view_document', 'indigo_api.view_commencement',
        'indigo_api.view_task', 'indigo_api.add_task',
        'indigo_api.view_amendment', 'indigo_api.view_arbitraryexpressiondate', 'indigo_api.view_country',
    )


class EditorBadge(PermissionBadge):
    slug = 'editor'
    name = 'Editor'
    group_name = name + ' Badge'
    description = 'Can create new works and edit the details of existing works, as well as working with tasks'
    permissions = (
        'indigo_api.add_work', 'indigo_api.change_work',
        'indigo_api.add_document', 'indigo_api.change_document',
        'indigo_api.view_documentactivity', 'indigo_api.add_documentactivity', 'indigo_api.change_documentactivity', 'indigo_api.delete_documentactivity',
        'indigo_api.view_attachment', 'indigo_api.add_attachment', 'indigo_api.change_attachment', 'indigo_api.delete_attachment',
        'indigo_api.add_amendment', 'indigo_api.change_amendment', 'indigo_api.delete_amendment',
        'indigo_api.add_arbitraryexpressiondate', 'indigo_api.change_arbitraryexpressiondate', 'indigo_api.delete_arbitraryexpressiondate',
        # required when restoring a document version
        'reversion.view_version', 'reversion.add_version', 'reversion.change_version',
        'indigo_api.add_task', 'indigo_api.change_task', 'indigo_api.submit_task', 'indigo_api.reopen_task', 'indigo_api.block_task',
    )


class PlaceAdminBadge(PermissionBadge):
    slug = 'place-admin'
    name = 'Place Admin'
    group_name = name + ' Badge'
    description = 'Can edit place settings'
    permissions = (
        'indigo_api.view_placesettings', 'indigo_api.add_placesettings', 'indigo_api.change_placesettings', 'indigo_api.delete_placesettings',
    )


class ResearcherBadge(PermissionBadge):
    slug = 'researcher'
    name = 'Researcher'
    group_name = name + ' Badge'
    description = 'Can perform bulk imports from and exports to spreadsheets'
    permissions = (
        'indigo_api.bulk_add_work', 'indigo_api.bulk_export_work',
    )


class ReviewerBadge(PermissionBadge):
    slug = 'reviewer'
    name = 'Reviewer'
    group_name = name + ' Badge'
    description = 'Can review works and tasks and delete documents and works, as well as working with workflows'
    permissions = (
        'indigo_api.delete_work', 'indigo_api.review_work',
        'indigo_api.add_commencement', 'indigo_api.change_commencement', 'indigo_api.delete_commencement',
        'indigo_api.review_document', 'indigo_api.delete_document', 'indigo_api.publish_document',
        'indigo_api.cancel_task', 'indigo_api.unsubmit_task', 'indigo_api.close_task',
    )


class SuperReviewerBadge(PermissionBadge):
    slug = 'super-reviewer'
    name = 'Super Reviewer'
    group_name = name + ' Badge'
    description = 'Can approve any tasks'
    permissions = ('indigo_api.close_any_task', 'indigo_api.exceed_task_limits')


class TaxonomistBadge(PermissionBadge):
    slug = 'taxonomist'
    name = 'Taxonomist'
    group_name = name + ' Badge'
    description = 'Can manage taxonomies'
    permissions = (
        'indigo_api.add_taxonomytopic', 'indigo_api.change_taxonomytopic', 'indigo_api.delete_taxonomytopic',
    )


class ConverterBadge(PermissionBadge):
    slug = 'converter'
    name = 'Converter'
    group_name = name + ' Badge'
    description = 'Can do conversion tasks'
    permissions = (
        'indigo_api.change_task', 'indigo_api.submit_task', 'indigo_api.reopen_task',
    )


badges.register(ContentAPIBadge)
badges.register(ContributorBadge)
badges.register(EditorBadge)
badges.register(PlaceAdminBadge)
badges.register(ResearcherBadge)
badges.register(ReviewerBadge)
badges.register(SuperReviewerBadge)
badges.register(TaxonomistBadge)
badges.register(ConverterBadge)


# when a user signs up, grant them some badges immediately
@receiver(user_signed_up, sender=User)
def grant_contributor_new_user(sender, request, user, **kwargs):
    for badge in settings.INDIGO_SOCIAL['new_user_badges']:
        badges.registry[badge].award(user=user)
